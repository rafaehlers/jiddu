"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/fallacies";
import type {
  KnowledgeEntityDTO,
  KnowledgeRelationDTO,
} from "@/lib/context-knowledge-schema";
import type { LiveContext } from "@/lib/live-context-schema";

const PROFILE_BATCH_SIZE = 3;
const MAX_AUTOMATIC_NEWS_TARGETS = 2;

export function useContextEnrichment(input: {
  sessionId: string | null;
  context: LiveContext;
  language: Lang;
  automaticNewsEnabled: boolean;
}) {
  const [entities, setEntities] = useState<
    ReadonlyMap<string, KnowledgeEntityDTO>
  >(new Map());
  const [relations, setRelations] = useState<
    ReadonlyMap<string, KnowledgeRelationDTO>
  >(new Map());
  const [errors, setErrors] = useState<ReadonlyMap<string, string>>(new Map());
  const [activity, setActivity] = useState({
    profileRequests: 0,
    newsRequests: 0,
  });
  const profileRequested = useRef(new Set<string>());
  const profileRequestKeys = useRef(new Map<string, string>());
  const newsRequested = useRef(new Set<string>());
  const pollTimeouts = useRef(new Set<number>());
  const controllers = useRef(new Set<AbortController>());
  const profileControllers = useRef(new Map<string, AbortController>());
  const newsPollTimeouts = useRef(new Set<number>());
  const newsControllers = useRef(new Set<AbortController>());
  const newsControllersByTarget = useRef(new Map<string, AbortController>());

  useEffect(() => {
    profileRequested.current.clear();
    profileRequestKeys.current.clear();
    newsRequested.current.clear();
    for (const timeout of pollTimeouts.current) window.clearTimeout(timeout);
    pollTimeouts.current.clear();
    for (const controller of controllers.current) controller.abort();
    controllers.current.clear();
    profileControllers.current.clear();
    for (const timeout of newsPollTimeouts.current)
      window.clearTimeout(timeout);
    newsPollTimeouts.current.clear();
    for (const controller of newsControllers.current) controller.abort();
    newsControllers.current.clear();
    newsControllersByTarget.current.clear();
    setEntities(new Map());
    setRelations(new Map());
    setErrors(new Map());
    setActivity({ profileRequests: 0, newsRequests: 0 });
  }, [input.sessionId]);

  useEffect(() => {
    if (!input.sessionId) return;
    const pending = input.context.entities.filter(
      (entity) => !profileRequested.current.has(entityRequestKey(entity)),
    );
    for (const entity of pending) {
      const key = entityRequestKey(entity);
      profileRequested.current.add(key);
      profileRequestKeys.current.set(entity.id, key);
      setEntities((current) => {
        if (!current.has(entity.id)) return current;
        const next = new Map(current);
        next.delete(entity.id);
        return next;
      });
    }
    void requestProfileBatches();

    async function requestProfileBatches() {
      for (let index = 0; index < pending.length; index += PROFILE_BATCH_SIZE) {
        await Promise.all(
          pending
            .slice(index, index + PROFILE_BATCH_SIZE)
            .map(requestEntityProfile),
        );
      }
    }

    async function requestEntityProfile(
      entity: LiveContext["entities"][number],
    ) {
      const key = entityRequestKey(entity);
      profileControllers.current.get(entity.id)?.abort();
      const controller = new AbortController();
      controllers.current.add(controller);
      profileControllers.current.set(entity.id, controller);
      setActivity((current) => ({
        ...current,
        profileRequests: controllers.current.size,
      }));
      try {
        const response = await fetch("/api/context/entities", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId: input.sessionId,
            language: input.language,
            entity,
          }),
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(`Profile request failed (${response.status})`);
        const data = (await response.json()) as {
          entity: KnowledgeEntityDTO;
          refreshScheduled?: boolean;
        };
        if (profileRequestKeys.current.get(entity.id) !== key) return;
        setEntity(entity.id, data.entity);
        clearError(entity.id);
        if (data.refreshScheduled) {
          pollEntity(entity.id, data.entity.id, key, 0);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            entity.id,
            error instanceof Error ? error.message : String(error),
          );
        }
      } finally {
        controllers.current.delete(controller);
        if (profileControllers.current.get(entity.id) === controller) {
          profileControllers.current.delete(entity.id);
        }
        setActivity((current) => ({
          ...current,
          profileRequests: controllers.current.size,
        }));
      }
    }

    function pollEntity(
      localEntityId: string,
      storedEntityId: string,
      requestKeyAtStart: string,
      attempt: number,
    ) {
      if (attempt >= 4) return;
      const timeout = window.setTimeout(async () => {
        pollTimeouts.current.delete(timeout);
        if (
          profileRequestKeys.current.get(localEntityId) !== requestKeyAtStart
        ) {
          return;
        }
        const controller = new AbortController();
        controllers.current.add(controller);
        setActivity((current) => ({
          ...current,
          profileRequests: controllers.current.size,
        }));
        try {
          const response = await fetch(
            `/api/context/entities/${storedEntityId}`,
            { signal: controller.signal },
          );
          if (!response.ok) return;
          const data = (await response.json()) as {
            entity: KnowledgeEntityDTO;
          };
          if (
            profileRequestKeys.current.get(localEntityId) !== requestKeyAtStart
          ) {
            return;
          }
          setEntity(localEntityId, data.entity);
          if (data.entity.stale || data.entity.profileStatus === "pending") {
            pollEntity(
              localEntityId,
              storedEntityId,
              requestKeyAtStart,
              attempt + 1,
            );
          }
        } catch {
          // A profile is optional; a later appearance can retry the cache.
        } finally {
          controllers.current.delete(controller);
          setActivity((current) => ({
            ...current,
            profileRequests: controllers.current.size,
          }));
        }
      }, [1_200, 2_400, 4_800, 7_500][attempt]);
      pollTimeouts.current.add(timeout);
    }

    function setEntity(localEntityId: string, entity: KnowledgeEntityDTO) {
      setEntities((current) => {
        const next = new Map(current);
        next.set(localEntityId, entity);
        return next;
      });
    }

    function setError(key: string, message: string) {
      setErrors((current) => {
        const next = new Map(current);
        next.set(key, message);
        return next;
      });
    }

    function clearError(key: string) {
      setErrors((current) => {
        if (!current.has(key)) return current;
        const next = new Map(current);
        next.delete(key);
        return next;
      });
    }
  }, [input.context.entities, input.language, input.sessionId]);

  useEffect(() => {
    if (input.automaticNewsEnabled) return;
    for (const timeout of newsPollTimeouts.current)
      window.clearTimeout(timeout);
    newsPollTimeouts.current.clear();
    for (const controller of newsControllers.current) controller.abort();
    newsControllers.current.clear();
    newsControllersByTarget.current.clear();
    setActivity((current) => ({ ...current, newsRequests: 0 }));
  }, [input.automaticNewsEnabled]);

  const automaticNewsTargets = useMemo(() => {
    const relationTargets = input.context.relations
      .filter((relation) => relation.importance >= 0.82)
      .map((relation) => {
        const sourceName = input.context.entities.find(
          (entity) => entity.id === relation.sourceEntityId,
        )?.name;
        const targetName = input.context.entities.find(
          (entity) => entity.id === relation.targetEntityId,
        )?.name;
        return {
          key: `relation:${relation.id}:${requestKey(sourceName ?? "")}:${requestKey(targetName ?? "")}`,
          baseKey: `relation:${relation.id}:`,
          importance: relation.importance + 0.05,
          kind: "relation" as const,
          relation,
        };
      });
    const entityTargets = input.context.entities
      .filter((entity) => entity.importance >= 0.78)
      .map((entity) => ({
        key: `entity:${entity.id}:${requestKey(entity.name)}:${entity.userCorrectedAt ?? "model"}`,
        baseKey: `entity:${entity.id}:`,
        importance: entity.importance,
        kind: "entity" as const,
        entity,
      }));
    return [...relationTargets, ...entityTargets]
      .sort((left, right) => right.importance - left.importance)
      .slice(0, MAX_AUTOMATIC_NEWS_TARGETS);
  }, [input.context.entities, input.context.relations]);

  useEffect(() => {
    if (!input.sessionId || !input.automaticNewsEnabled) return;
    for (const target of automaticNewsTargets) {
      for (const existing of newsRequested.current) {
        if (existing !== target.key && existing.startsWith(target.baseKey)) {
          newsRequested.current.delete(existing);
        }
      }
      if (newsRequested.current.size >= MAX_AUTOMATIC_NEWS_TARGETS) break;
      if (newsRequested.current.has(target.key)) continue;
      newsRequested.current.add(target.key);
      newsControllersByTarget.current.get(target.baseKey)?.abort();
      void requestNews(target);
    }

    async function requestNews(
      target: (typeof automaticNewsTargets)[number],
      refreshAttempt = 0,
    ) {
      const controller = new AbortController();
      newsControllers.current.add(controller);
      newsControllersByTarget.current.set(target.baseKey, controller);
      setActivity((current) => ({
        ...current,
        newsRequests: newsControllers.current.size,
      }));
      try {
        const payload =
          target.kind === "entity"
            ? {
                target: "entity",
                sessionId: input.sessionId,
                language: input.language,
                entity: target.entity,
              }
            : relationPayload(target.relation);
        if (!payload) return;
        const response = await fetch("/api/context/news", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(`News request failed (${response.status})`);
        const data = (await response.json()) as
          | {
              target: "entity";
              entity: KnowledgeEntityDTO | null;
              refreshScheduled?: boolean;
            }
          | {
              target: "relation";
              relation: KnowledgeRelationDTO | null;
              refreshScheduled?: boolean;
            };
        if (!newsRequested.current.has(target.key)) return;
        if (
          target.kind === "entity" &&
          data.target === "entity" &&
          data.entity
        ) {
          setEntities((current) => {
            const next = new Map(current);
            next.set(target.entity.id, data.entity!);
            return next;
          });
          clearNewsError(target.key);
        }
        if (
          target.kind === "relation" &&
          data.target === "relation" &&
          data.relation
        ) {
          setRelations((current) => {
            const next = new Map(current);
            next.set(target.relation.id, data.relation!);
            return next;
          });
          clearNewsError(target.key);
        }
        if (data.refreshScheduled && refreshAttempt < 2) {
          const timeout = window.setTimeout(
            () => {
              newsPollTimeouts.current.delete(timeout);
              if (
                !input.automaticNewsEnabled ||
                !newsRequested.current.has(target.key)
              ) {
                return;
              }
              void requestNews(target, refreshAttempt + 1);
            },
            refreshAttempt === 0 ? 5_000 : 9_000,
          );
          newsPollTimeouts.current.add(timeout);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrors((current) => {
            const next = new Map(current);
            next.set(
              target.key,
              error instanceof Error ? error.message : String(error),
            );
            return next;
          });
        }
      } finally {
        newsControllers.current.delete(controller);
        if (newsControllersByTarget.current.get(target.baseKey) === controller) {
          newsControllersByTarget.current.delete(target.baseKey);
        }
        setActivity((current) => ({
          ...current,
          newsRequests: newsControllers.current.size,
        }));
      }
    }

    function relationPayload(relation: LiveContext["relations"][number]) {
      const sourceEntity = input.context.entities.find(
        (entity) => entity.id === relation.sourceEntityId,
      );
      const targetEntity = input.context.entities.find(
        (entity) => entity.id === relation.targetEntityId,
      );
      if (!sourceEntity || !targetEntity) return null;
      return {
        target: "relation",
        sessionId: input.sessionId,
        language: input.language,
        relation,
        sourceEntity,
        targetEntity,
      };
    }

    function clearNewsError(key: string) {
      setErrors((current) => {
        if (!current.has(key)) return current;
        const next = new Map(current);
        next.delete(key);
        return next;
      });
    }
  }, [
    automaticNewsTargets,
    input.automaticNewsEnabled,
    input.context.entities,
    input.language,
    input.sessionId,
  ]);

  useEffect(
    () => () => {
      for (const timeout of pollTimeouts.current) window.clearTimeout(timeout);
      for (const controller of controllers.current) controller.abort();
      for (const timeout of newsPollTimeouts.current)
        window.clearTimeout(timeout);
      for (const controller of newsControllers.current) controller.abort();
    },
    [],
  );

  return { entities, relations, errors, activity };
}

function entityRequestKey(entity: LiveContext["entities"][number]) {
  return `${entity.id}:${requestKey(entity.name)}:${entity.userCorrectedAt ?? "model"}`;
}

function requestKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

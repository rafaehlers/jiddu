# Third-party notices

The [MIT License](./LICENSE) applies to Jiddu's original code and
documentation. It does not replace the licenses or rights of its
dependencies, research sources, datasets, or third-party content.

## Software dependencies

Dependency versions and declared licenses are recorded in the root
`package-lock.json` and `packages/jiddu-mcp/package-lock.json`. Preserve
the LICENSE, COPYING, NOTICE, and copyright files supplied by dependencies
when redistributing them, including bundled or native components.

Direct application and MCP dependencies use MIT, Apache-2.0, or ISC.
Transitive packages also include BSD, MPL-2.0, LGPL-3.0-or-later, and other
licenses. In particular:

- **Sharp/libvips:** native libvips binaries and some Sharp platform packages
  carry LGPL-3.0-or-later terms in addition to other component licenses.
  See the [sharp-libvips distribution](https://github.com/lovell/sharp-libvips)
  and the license files supplied with the platform package.
- **Lightning CSS and axe-core:** MPL-2.0; retain their license notices and
  comply with the source requirements if redistributing modified covered files.
- **seq-queue 0.0.5:** its package metadata omits a license field, but the
  distributed `LICENSE` grants MIT rights. Copyright © 2012 Netease, Inc.
  and other pomelo contributors.

An installation downloads these packages from their respective publishers.
Jiddu's license does not relicense their code. A source release and a
distribution containing third-party binaries have different contents;
preserve the notices appropriate to the artifact you distribute.

## no-ai-slop

The initial slop-pattern taxonomy draws on Peter Yang's
[no-ai-slop](https://github.com/petergyang/no-ai-slop). Jiddu supplies its
own catalog wording, translations, detection prompt, and implementation.
The upstream MIT notice is preserved here:

```text
MIT License

Copyright (c) 2026 Peter Yang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Research, datasets, and demonstrations

Claimify, Distilling Expert Judgment at Scale, and the AAAI-26 AI Review
Pilot are cited as methodological references in the README. Those papers
and their authors' materials retain their own rights. Jiddu's implementations
and prompts are documented in this repository.

The PolitiFact benchmark uses the
[LIAR2 dataset](https://github.com/chengxuphd/liar2), whose repository carries
Apache-2.0. Downloaded raw benchmark data is kept under the ignored
`scripts/data` directory. Follow the dataset's license and any underlying
content rights when downloading or redistributing it.

The curated seed demos and paper-review fixtures are example materials,
not exports of production accounts. Public-source quotations, citations,
and source documents retain their authors' rights.

## Screenshots and external services

Screenshots showing The New York Times, YouTube, g1, GloboNews, public
figures, or other third-party pages illustrate the application. The
publishers' articles, images, videos, logos, and other materials shown in
those screenshots retain their own rights and are not relicensed under MIT.

WorkOS, Stripe, OpenRouter, OpenAI, Perplexity, Resend, and other services
have their own terms. Publishing Jiddu's integration code does not grant
access to their accounts, API credentials, models, or service credits.

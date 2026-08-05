const JIDDU_HOME_URL = "https://jiddu.app";
const JIDDU_EMAIL_LOGO_URL =
  "https://jiddu.app/brand/jiddu_logo_email.png";

export function emailBrandHeader(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border-bottom:1px solid #ded8ce;">
  <tr>
    <td style="padding:0 0 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td width="80" valign="middle" style="width:80px;vertical-align:middle;">
            <a href="${JIDDU_HOME_URL}" style="display:block;text-decoration:none;">
              <img src="${JIDDU_EMAIL_LOGO_URL}" width="64" height="64" alt="Jiddu" style="display:block;width:64px;height:64px;border:1px solid #ded8ce;border-radius:12px;" />
            </a>
          </td>
          <td valign="middle" style="padding-left:16px;vertical-align:middle;">
            <a href="${JIDDU_HOME_URL}" style="display:block;color:#211f1b;text-decoration:none;">
              <span style="display:block;margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:18px;font-weight:700;letter-spacing:0.22em;color:#d5533b;">JIDDU</span>
              <span style="display:block;margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:32px;font-weight:700;color:#211f1b;">Critical reading</span>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

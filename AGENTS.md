<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Partner data sharing is enforced in the database: every user table's SELECT policy allows `auth.uid()` or `public.get_partner_id()`, writes are owner-only. Why: the couple must see each other's data but never edit it.
- `profiles.partner_id` is not client-writable (column-level UPDATE grants); pairing only goes through the `link_partner` / `unlink_partner` RPCs. Why: a writable partner_id would let anyone read any user's data.
- The stopwatch state lives on the profile row (`active_subject`, `active_started_at`, `active_accumulated_seconds`), not in local storage. Why: survives refresh/device switch and lets the partner see live status via realtime.
- YKS exam rules (sections, question counts, net = correct − wrong/4) live only in `src/lib/yks.ts` with tests in `src/lib/yks.test.ts`. Why: one source of truth for net math.
- Themes are `[data-theme="<id>"]` blocks in `src/styles.css`, chosen per device (localStorage) and applied pre-paint by a head script. Theme previews reuse the same tokens by setting `data-theme` on a wrapper. Why: components stay token-only.

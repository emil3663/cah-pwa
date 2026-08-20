# Content, Attribution and Naming Decision Record

Date: 2026-08-20
Status: ✅ DECIDED — keep the name, attribute the content, licence the code
Ticket: PRR-002 (Portfolio Review-Readiness Backlog)

## Problem

This repository is a Cards Against Humanity–style game whose card content originates
from the open-source `json-against-humanity` dataset, which is published under
Creative Commons BY-NC-SA. The repository carried no licence file and no attribution
notice.

Nothing about that was wrong in itself. The problem was that the position was
*unstated*, and this repository is part of a portfolio shown to employers — including
legal-technology employers, who are precisely the audience most likely to notice an
unattributed CC-licensed dataset and a trademarked name. An unstated position reads
as an unconsidered one, and the cost of stating it is a paragraph.

## Options considered

1. **Keep the name, attribute the content.** Add attribution and the CC BY-NC-SA
   terms to the README, licence the original code separately, and record the position
   here. Cheapest, and demonstrates the same due-diligence instinct the portfolio is
   meant to evidence.
2. **Rename and generic the branding.** Keep the engine, the prompt architecture and
   every decision record; drop the Cards Against Humanity name and substitute a
   different card set. Removes the question entirely, at the cost of rework and of
   losing the recognisability that makes the project easy to explain.
3. **Keep as-is, de-emphasise in applications.** Leave the repository untouched and
   lead with other projects. Avoids the work but leaves the loose end in place for
   anyone who does look.

## Decision

**Option 1.** The name stays, the content is attributed, the original code carries its
own licence, and this record explains the reasoning.

The project's value in the portfolio has never been the card content — it is the
prompt-driven architecture, the Firestore security model, the phase decision records
and the test-plan-to-spec generator. All of that is original work and is licensed as
such. The card data is third-party, non-commercial, and now credited.

## Scope

- Add an Attribution section to `README.md` naming `json-against-humanity` as the
  source of the card content and stating its CC BY-NC-SA terms.
- Add a licence file covering the original code in this repository.
- State in the README that this is a non-commercial personal project, not affiliated
  with or endorsed by Cards Against Humanity LLC.
- Keep this record in the repository as the standing explanation.

## Attribution text for the README

> ## Attribution and licensing
>
> The card content in this project comes from the
> [json-against-humanity](https://github.com/crhallberg/json-against-humanity) dataset,
> which packages Cards Against Humanity content released by Cards Against Humanity LLC
> under a **Creative Commons BY-NC-SA** licence. That content remains under its original
> terms, and this project is non-commercial.
>
> The original code in this repository — the application, the prompt architecture, the
> Firestore data and security model, the test tooling and all project documentation — is
> released under the MIT Licence. See `LICENSE`.
>
> This is a personal, non-commercial project. It is not affiliated with, endorsed by, or
> sponsored by Cards Against Humanity LLC.

## Acceptance criteria

- [ ] `README.md` contains the Attribution and licensing section above.
- [ ] A `LICENSE` file exists covering the original code.
- [ ] The README states the non-commercial, unaffiliated position explicitly.
- [ ] The position can be explained in one sentence at interview, from this record.

## Note on scope of this record

This is a presentation and attribution decision, not legal advice. It settles how the
repository *describes* itself. If the project ever moves toward commercial use, or if
the question becomes something other than reputational, that is the point to get a
real opinion from someone qualified.

---

This closes PRR-002. PRR-104 (licence files across the remaining repositories) depends
on it and is now unblocked.

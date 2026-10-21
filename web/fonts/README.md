# Local typefaces

The existing Outfit and Plus Jakarta Sans families are served locally as two
unaltered variable WOFF2 files (Latin subset, including precomposed Spanish
accents, ñ and ¿/¡). They use `font-display: swap` with the system fallback.
No font processing or build step is required. Total font payload: 59,640 bytes.

Downloaded on 2026-10-16 from the Google Fonts CSS API, requesting
`Outfit:wght@100..900` and `Plus+Jakarta+Sans:wght@200..800`:

- Outfit v15: https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtq.woff2
- Plus Jakarta Sans v12: https://fonts.gstatic.com/s/plusjakartasans/v12/LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko20yw.woff2

Original licenses are included unchanged:

- `Outfit-OFL.txt`: https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt
- `Plus-Jakarta-Sans-OFL.txt`: https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/OFL.txt

Both are SIL Open Font License 1.1. All image originals and GSAP/ScrollTrigger
3.15.0 remain unchanged. No additional JavaScript library is introduced.

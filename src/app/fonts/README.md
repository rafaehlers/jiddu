# Bundled fonts

Jiddu loads these WOFF2 files through `next/font/local`. Builds use the
committed files without fetching font CSS or binaries from Google Fonts.

All three fonts retain the SIL Open Font License 1.1. Keep their copyright
and license files when redistributing them. The application MIT License
does not replace the font licenses.

| File | Upstream source | Source Git blob SHA-1 | License |
| --- | --- | --- | --- |
| Geist.woff2 | [Geist variable TTF](https://github.com/google/fonts/blob/main/ofl/geist/Geist%5Bwght%5D.ttf) | `f63f0afc6390323715972b6645115485f37cc9f4` | [geist-OFL.txt](./geist-OFL.txt) |
| GeistMono.woff2 | [Geist Mono variable TTF](https://github.com/google/fonts/blob/main/ofl/geistmono/GeistMono%5Bwght%5D.ttf) | `173867dce0580ea751e4b9c558740d34f20ce549` | [geistmono-OFL.txt](./geistmono-OFL.txt) |
| Newsreader.woff2 | [Newsreader variable TTF](https://github.com/google/fonts/blob/main/ofl/newsreader/Newsreader%5Bopsz%2Cwght%5D.ttf) | `ad4a9a8c44ec328c80b61c773f1ba02f6b5ed292` | [newsreader-OFL.txt](./newsreader-OFL.txt) |

Sources were retrieved on October 13, 2026. Their Git blob hashes and the
license files were verified against the Google Fonts repository.

FontTools converted the TTF sources to WOFF2. Geist and Geist Mono retain
their variable weight axis. Newsreader's optical-size axis was fixed at
16 before conversion, matching the font previously served by Google
Fonts; its weight axis remains variable. No glyphs were removed.

To reproduce the conversion with Python, FontTools, and Brotli installed:

```python
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

font = TTFont("upstream.ttf")
# For Newsreader only:
# instantiateVariableFont(font, {"opsz": 16}, inplace=True)
font.flavor = "woff2"
font.save("output.woff2")
```

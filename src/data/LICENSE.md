# Licence for the data in this folder

`interactions.json` is derived from **DDInter** (https://ddinter.scbdd.com/), the drug–drug interaction database described in:

> Xiong G, Yang Z, Yi J, et al. DDInter: an online drug–drug interaction database towards improving clinical decision-making and patient safety. *Nucleic Acids Research*. 2022;50(D1):D1200–D1207. doi:[10.1093/nar/gkab880](https://doi.org/10.1093/nar/gkab880)

DDInter's data is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International licence](https://creativecommons.org/licenses/by-nc-sa/4.0/) (CC BY-NC-SA 4.0), per DDInter's [terms](https://ddinter.scbdd.com/terms/). This derived file is shared under the same licence.

What changed from the original: the downloaded CSV files were merged, duplicate pairs removed, and the drug names and severity levels stored in a compact JSON format by `scripts/build-interactions.mjs`. No interaction or severity was edited.

This licence covers only the data in this folder. MediMatch's code is MIT-licensed (see the `LICENSE` file at the root of the repository).

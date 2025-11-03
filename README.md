# AnnoLens (IEEE VIS 2025)

AnnoLens is an interactive visual analytics system that uses lens-based guidance to enable exploration and annotation,
as presented at [IEEE VIS 2025 short paper track](https://ieeevis.org/year/2025/program/paper_2b485865-8584-417a-bd55-5a961dcff5ef.html). The paper and supplemental material are available on OSF: [https://osf.io/zpu6c/](https://osf.io/zpu6c/).

<div style="margin-bottom: 2em; margin-top: 0;">
<b>How to cite:</b>

Becker, Franziska and Koch, Steffen and Blascheck, Tanja. "AnnoLens: Exploration and Annotation through Lens-Based Guidance". 2025 IEEE Visualization and Visual Analytics (VIS). IEEE. 2025.
</div>


**BibTex:**
```bibtex
@inproceedings{becker:anno:2025,
  title={AnnoLens: Exploration and Annotation through Lens-Based Guidance},
  author={Becker, Franziska and Koch, Steffen and Blascheck, Tanja},
  booktitle={2025 IEEE Visualization and Visual Analytics (VIS)},
  pages={1--5},
  year={2025},
  organization={IEEE}
}

```

## Demo

You can play around with AnnoLens at [https://arielmant0.github.io/anno-lens/](https://arielmant0.github.io/anno-lens/).
**Chrome** is recommended to get the best experience.

## Related Publication

The games tagging dataset in the demo was taken from the following paper, with the data available on OSF at [https://osf.io/fhgm6/](https://osf.io/fhgm6/):

Becker, Franziska and Warnking, René and Brückler, Hendrik and Blascheck, Tanja. "Beyond Entertainment: An Investigation of Externalization Design in Video Games." Computer Graphics Forum. 2025. doi: [https://doi.org/10.1111/cgf.70124](https://doi.org/10.1111/cgf.70124)

## Manual

AnnoLens has a primary (red) and secondary (lens). When you move the primary lens,
the system will calculate the relevance of all attributes/columns in the dataset.
The most relevant column will be selected, changing the contours behind the plot and the dot's coloring.
The system will also look for another group of points with a similar relevance score for the selected column.

### Moving a lens

- Click on the lens, then it will follow your cursor
- Click on the lens again, then it will **stop** following you

### Selecting a column

- Click the **A** key or the **A** button in the hotbar to go the **previous** column
- Click the **D** key or the **D** button in the hotbar to go the **next** column
- Click on a mini-lens (next to the primary and secondary lens) to go to that column
- Click on a column label in the bar chart list to go that columns for the respective lens
- Click on the **link** between bar charts to go to that column for **both** lenses

### Annotating

- Click one of the colored buttons in the hotbar (1-5) or use the keys 1 to 5
- Click on the column label of a mini-lens to annotate that column for that lens
- Click on a bar in a bar chart to annotate the column **and** value
- Click on a colored plus icon next to an existing annotation (only visible when the cursor is over the annotation), this will also add all the data points under the selected lens to the annotation

## Installation

AnnoLens uses Vue.js + Vuetify for the page and d3.js for drawing.
To install, download the code in this repository

*Using npm*
```shell
npm install
```

*Using yarn*
```shell
yarn install
```

To run the application for development, execute

*Using npm*
```shell
npm run dev
```

*Using yarn*
```shell
yarn dev
```

To run the application for production, execute

*Using npm*
```shell
npm run build
npm run preview
```

*Using yarn*
```shell
yarn build
yarn preview
```
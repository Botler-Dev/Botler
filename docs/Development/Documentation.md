# Working with Docs

This project uses MkDocs to generate its documentation so first install it using `conda` (Miniconda or Anaconda).

```shell
conda env create -f ./environment.yml
```

And then activate the just created `botler-mkdocs` enviroment.

```shell
conda activate botler-mkdocs
```

From this point on you can just use the `mkdocs` command to serve (`mkdocs serve`) or build (`mkdocs build`) the docs. For additional information check out the [MkDocs Docs](https://www.mkdocs.org/) or the [Material Theme Docs](https://squidfunk.github.io/mkdocs-material/getting-started/) of the theme used.

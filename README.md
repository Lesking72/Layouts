﻿# Themezer Layouts

![Deploy](https://github.com/ThemezerNX/Layouts/workflows/Deploy/badge.svg)

This repository holds all layouts with pieces available on the website.
Pieces are small json files with patches for the original layout. This way the visitor can modify the layout using the available pieces to their taste. The Themezer website downloads the layout and saves the layout uuid and pieces uuids as a string in the ID field in the layout.json.
For Themezer this ID string has the following structure:

```
<service>:[layout uuid]|[pieces uuids separated by ',']
```

An example:

```json
    ...
    "AuthorName": "Name",
    "TargetName": "ResidentMenu.szs",
    "ID": "Themezer:e4446038-b47a-11ea-b3de-0242ac130004|e96002f2-b47a-11ea-b3de-0242ac130004,f057c2f2-b47a-11ea-b3de-0242ac130004",
    ...
```

A user should **never modify the ID value manually** in a downloaded layout from Themezer.

# Submitting Layouts/Pieces

Layout and piece submissions happen through pull requests.
Anyone with a GitHub account can contribute.

This repository has the following structure:
(everyting with a `*` is mandatory)

```
.
└── [target file *]
    └── [layout name *]
        ├── common.json
        ├── details.json *
        ├── layout.json *
        ├── overlay.png *
        └── pieces
            ├── [piece no.]_[Piece Title *]
            |   ├── [Value].json *
            |   └── [Value].png *
                //  ^ A single value becomes a toggle

            └── [piece no.]_[Piece Title *]
                ├── [Value 1].json *
                ├── [Value 1].png *
                ├── [Value 2].json *
                └── [Value 2].png *
                //  ^ Multiple values become a dropdown
```

### Notes:

-   For every layout, an overlay.png is required.
-   For every piece value, a png is required.
-   The 'target file' may be any of the following:
    -   `ResidentMenu` (Home Menu)
    -   `Entrance` (Lockscreen)
    -   `Flaunch` (All Apps)
    -   `Set` (Settings)
    -   `Notification` (News)
    -   `Psl` (Player Select)
    -   `MyPage` (User Page)

## The `details.json`

The `details.json` contains information to display on the website. You're allowed to edit the following fields:

(everyting with a `*` is mandatory)

```json
{
	"name": "", *
	"description": "", *
	"creator_id": "", *
	"color": "",
	"version": "", *
}
```

-   `name`: The name of the layout
-   `description`: A short description of your layout
-   `creator_id`: Your discord user id. You can find this by visiting [this page](https://themezer.ga/me) on Themezer. The id will be displayed in the url. You must login **at least once** before submitting.
-   `color`: A hex color to display behind the overlay (example: `#7ca982`)
-   `version`: A string with the layout version (example: "1.0")

### Notes:

-   When a pull request is merged the `uuid` field is automatically added to the `details.json`. You must never add/edit this yourself!
-   Remove the color field if not in use.

## Pieces

-   Piece folders can have a prefix with a number: `1_`. This allows you to specify the order the layouts are applied in.
-   The 'Piece Title' is shown on the website as the option.
-   A piece value json always requires a corresponding png. This png is an overly. The overlay must be made from the layout with only the piece it is for active. File names must **always** match.
-   For a single value (toggle): the value file name does not matter (although they must still match) as it becomes a toggle with the 'Piece Title'
-   For a dropdown: the values filenames _do_ matter. Every value file name will be an entry in the dropdown.
-   When a pull request is merged the `uuid` field is automatically added to the `[value].json`. You must never add/edit this yourself!

**Pull requests not meeting the requirements won't be merged (right away).**

# Creating overlays

[There is a tool for this on the Themezer website.](https://themezer.ga/tools/overlaycreator)

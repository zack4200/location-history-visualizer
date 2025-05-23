# location-history-visualizer
> **Note**  
> The original project seemed abandoned. This version is up to date, and is compatible with the updated Google Maps history export.
> And merged some minor fixes from open pull requests and forks.

**Available online: [https://lucas-vdr-horst.github.io/location-history-visualizer/](https://lucas-vdr-horst.github.io/location-history-visualizer/)**

A tool for visualizing your complete, consolidated, collected Google Timeline data.

It works directly in your web browser &ndash; no software to download, no packages to install. **Everyone deserves to know what data is being collected about them, without having to fiddle with cryptic pieces of software.**

*location-history-visualizer* takes raw Timeline export and produces a heatmap of all of your location data over time, overlaid on an interactive map.

## Packages used
* [leaflet.js](http://leafletjs.com/), for rendering the interactive map
* [leaflet.heat](https://github.com/Leaflet/Leaflet.heat), for rendering the heatmap overlay
* [filestream](https://github.com/DamonOehlman/filestream), for dealing with gigantic Google Takeout files
* [oboe.js](http://oboejs.com), for processing said gigantic files
* [browserify](http://browserify.org/), for helping filestream  work properly in the browser


## License

Copyright (C) 2014 Theopolisme <theopolismewiki@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

# Tabulata

Tabulata is a web application build in Javascript which calculates and aggregates list-based data. Its function expressions are versatile and easy to read and use.

For a quick overview of the functionality, see http://www.tabulata.info/

A working installation of tabulata including the examples is available at http://tabulata.jit.su/

## Technical Design

Tabulata has a slim server backend built in Node.js using Express. Persistence is done using Redis (which was chosen due to having a very easy interface). The client is written using mainly Javascript and jQuery. It uses JSON-REST to fetch content from the backend. Calculation is done client-side (but could be done also server-side). 

The client divides responsabilitiy between *frontend* (rendering) and *backend* (calculation). [PEG.js](http://pegjs.majda.cz/) is used to parse the tabulata expressions. The grammar is defined in <a href="prototype/docs/tabulata-expression.peg">prototype/docs/tabulata-expression.peg</a>.


## Installation and Running

1. Tabulata uses [Node.js](http://nodejs.org/) and [Redis](http://redis.io/). Have them installed.
1. Edit the config file <a href="prototype/config/config.json">prototype/config/config.json/</a>, if necessary
1. Install packages and run node:

   ```
   npm install
   node app
   ```

## Future Plans

+ Use a client-side framework for event handling, rendering
+ Offer results as JSON feed
+ Many GUI improvements
+ More help when constructing expressions: custom keyboard, especially for tablet users
+ Include custom calculation functions
+ Use precise Numbers library

## License

GNU Affero General Public License

----------------

Copyright (C) 2012 Samuel Rutishauser (samuel@rutishauser.name)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

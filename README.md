# Tabulata

Tabulata is a web application built in Javascript which calculates and aggregates list-based data. Its function expressions are versatile and easy to read and use.

For a quick overview of the functionality, see http://www.tabulata.info/

A working installation of tabulata including the examples is available at http://tabulata.jit.su/

## Technical Design

Tabulata has a slim server backend built in [Node.js](http://nodejs.org/) using [Express](http://expressjs.com/). Persistence is done using [Redis](http://redis.io/) (which was chosen due to having a very easy interface). The client is written using Javascript and [jQuery](http://jquery.com/). It uses JSON-REST to fetch content from the backend. Calculation is done client-side (but could be done also server-side). 

The client divides responsabilitiy between *frontend* (GUI, rendering) and *backend* (calculation). The backend code is designed to be executed as a WebWorker, though currently it's not to facilitate development. [PEG.js](http://pegjs.majda.cz/) is used to parse the tabulata expressions (which are then translated into Javascript to be executed). The grammar is defined in <a href="tabulata/blob/master/prototype/docs/tabulata-expression.peg">prototype/docs/tabulata-expression.peg</a>.

### Source Files Organization

+ Node.js server -- <a href="tabulata/blob/master/prototype/app.js">blob/master/prototype/app.js</a>
+ Calculation engine -- <a href="tabulata/tree/master/prototype/app/engine">tree/master/prototype/app/engine</a>
+ Backend -- <a href="tabulata/tree/master/prototype/app/client/backend">tree/master/prototype/app/client/backend</a>
+ Interface between Frontend and Backend -- <a href="tabulata/tree/master/prototype/app/interface">tree/master/prototype/app/interface</a>
+ Frontend (GUI) -- <a href="tabulata/tree/master/prototype/app/client/frontend">tree/master/prototype/app/client/frontend</a>


## Installation and Running

1. Tabulata uses [Node.js](http://nodejs.org/) and [Redis](http://redis.io/). Have them installed.
1. Edit the config file <a href="tabulata/blob/master/prototype/config/config.json">prototype/config/config.json</a>, if necessary
1. Install packages and run node:

   ```
   npm install
   node app
   ```

## Future Plans

+ Use a client-side framework for event handling, rendering
+ Make WebWorker working again
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

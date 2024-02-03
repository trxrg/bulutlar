# Template for React with Electron

## How to run
to install the node modules
``` bash
npm run install
```
to setup a test db under ./backend/db
``` bash
npm run setup-test-db
```
to run react and electron concurrently
``` bash
npm run dev
```
## Folders
- backend
contains backend related files
  - db-setup
  test db files, can be used for db initialization
  - sequelize
  contains models folder, extra-setup.js for relations, index.js for initialization
  - service
  for backend services
- public
contains index.html
- src
contains react code and backend adapter for communication between react and backend

## How to develop further
- backend dev
  - add entities into ./backend/sequelize/models
  - add relations into ./backend/sequelize/extra-setup.js
  - define the models in ./backend/sequelize/index.js
  - add service for crud in ./backend/service
  - add service methods to api in ./backend/preload.js
  - add service methods to adapter in ./src/backend-adapter/BackendAdapter.js
- frontend dev
  - usual react development in ./src folder

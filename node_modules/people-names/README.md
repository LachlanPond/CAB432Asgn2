# people-names [![Build Status](https://travis-ci.org/AlessandroMinoccheri/human-names.svg?branch=master)](https://travis-ci.org/AlessandroMinoccheri/human-names)

Get popular human english, italian, french, deutch or spanish names.

## Install

```
$ npm install --save people-names
```


## Usage

```js
var x = require('people-names');


x.parseNames("Thomas passed the ball to Daniel who kicked it to Maria")
=> ['Thomas', 'Daniel', 'Maria']

x.isPersonName('Daniel')
=> true

x.femaleRandom();
//=> Lucy
```


## API

### .female

Type: `array`

Top female names sorted by popularity.

### .male

Type: `array`

Top male names sorted by popularity.

### .all

Type: `array`

Top names sorted by popularity.

### .femaleRandom()

Type: `function`

Random female name.

### .maleRandom()

Type: `function`

Random male name.

### .allRandom()

Type: `function`

Random name.


## CLI

```
$ npm install --global human-names
```

```
$ people-names --help

  Examples
    $ people-names
    Lucy

    $ human-names --all --type male
    Max
    John
    ...

  Options
    --all   Get all names instead of a random name
    --type  Type of name: female|male|all  Default: all
    --lang  lang of name: en|it|fr|de|es  Default: en
```

# VOD Review (working title)

## Overview

As a competitor in a fighting game, one of the most useful tools for improvement is reviewing footage of your matches, or a VOD (side note: usually, players also study VODs they are not personally featured in). But more often than not, your VODs are not always in the same place, which can make it annoying to review multiple VODS in the same session.

VOD Review (working title) is a web app that will allow users to keep track of their VODs. Users can register and login. Once they're logged in, they can create or view their VOD list/the list of all VODs added by every user on the site. Non-users can see the site-wide list, but not individual personal lists. For their personal list, users can add items (which would also add it the site-wide list). Users and non-users can filter lists by certain parameters (game, players, characters).


## Data Model

The application will store Users, Lists and Items

* each list can have multiple items (by embedding)
* each list can be filtered by certain parameters (game, players, characters)
  * the filtering for players and characters can be as follows:
    * you can filter by just one player/character 
    * you can filter by two players/characters, but you can specify whether you're looking for items that have both players/characters or just one of them 


An Example User:

```javascript
{
  username: "fightingfred",
  password: // a password,
  lists: // an array of references to List documents
}
```

An Example List with Embedded Items:

```javascript
{
  user: // a reference to a User object
  items: [
    { title: "KJH vs Ginger - Melee Singles Top 48: Losers Round 4 - Full Bloom 5", url: "https://www.youtube.com/watch?v=sqejT7uo5eA", game: "Super Smash Bros. Melee", players: ["Ginger", "KJH"], chars: ["Falco", "Fox"]},
    { name: "ZeRo vs Armada - Singles Bracket: Losers' Round 1 - Smash Ultimate Summit | Wolf vs Inkling", url: "https://www.youtube.com/watch?v=qo2UUed_p24&t=1428s", game: "Super Smash Bros. Ultimate", players: ["ZeRo", "Armada"], chars: ["Wolf", "Inkling"]},
  ]
}
```


## [Link to Commented First Draft Schema](db.js) 

## Wireframes

(___TODO__: wireframes for all of the pages on your site; they can be as simple as photos of drawings or you can use a tool like Balsamiq, Omnigraffle, etc._)

/list/create - page for creating a new shopping list

![list create](documentation/list-create.png)

/list - page for showing all shopping lists

![list](documentation/list.png)

/list/slug - page for showing specific shopping list

![list](documentation/list-slug.png)

## Site map

(documentation/sitemap.png)

## User Stories or Use Cases

1. as non-registered user, I can register a new account with the site
2. as non-registered user, I can view all the VOD items created by all users in a single list
3. as a user, I can log in to the site
4. as a user, I can create a new VOD item (which will automatically be added to my personal list and the site-wide list)
5. as a user, I can view all of the VOD items I've created in a single list
6. as a user, I can view all of the VOD items created by all users in single list

## Research Topics

(___TODO__: the research topics that you're planning on working on along with their point values... and the total points of research topics listed_)

* (3 points) Unit testing with JavaScript - Mocha
* (2 points) Use a CSS framework throughout the site - Bootstrap
* (3 points) Configuration management - nconf

* 8 points out of the required 8 points


## [Link to Initial Main Project File](app.js) 

## Annotations / References Used

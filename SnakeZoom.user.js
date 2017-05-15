// ==UserScript==
// @name         SnakeZoom
// @namespace    https://github.com/Ichaelus/UserScripts
// @version      0.23
// @description  try to take over the world!
// @author       LaxLeo
// @match        http://slither.io/
// @downloadURL  https://raw.githubusercontent.com/Ichaelus/UserScripts/master/SnakeZoom.user.js
// @updateURL    https://raw.githubusercontent.com/Ichaelus/UserScripts/master/SnakeZoom.user.js
// @grant        unsafeWindow
// ==/UserScript==

(function(){
  'use strict';
  if (window.top != window.self){  //-- Don't run on frames or iframes
      console.log("[#] Frame blocked");
      return;
  }

    let W = unsafeWindow;

    var SnakeScript = {
        init: function(){
            Zoom.init();
            addListenerToPlayButton();
        }
    };

    var User = {

    };

    var Zoom = {
        /*
         KEYMAP
         Shift | Zoom out a little while pressed
         Strg  | Zoom in a little while pressed
         <     | Switch between current zoom and initial zoom
        */
        zoomState:{
            currentZoom: 0.0,
            sigmoidMultiplier: 1.0,
        },
        settings: {
            ctrlDown: false,
            shiftDown: false,
            lockZoom: false,
            zoomFactor: W.gsc
        },
        init: function(){
            W.addEventListener("keydown", Zoom.keyPressed, false);
            W.addEventListener("keyup", Zoom.keyReleased, false);
            W.addEventListener("mousewheel", Zoom.zommOnScroll, false);
            setInterval(Zoom.updateZoomfactor, 10);
        },
        keyPressed: function(KeyEvent){
            if (W.gsc)
                Zoom.updateSettings(KeyEvent, true);
        },
        keyReleased: function(KeyEvent){
            if (W.gsc)
                Zoom.updateSettings(KeyEvent, false);
        },
        updateSettings: function(keyEvent, isKeyDown){
            Zoom.settings = {
                ctrlDown:  isKeyDown && keyEvent.keyCode == 17,
                shiftDown: isKeyDown && keyEvent.keyCode == 16,
           //     altDown:   isKeyDown && keyEvent.keyCode == 18,
                lockZoom:  (isKeyDown && keyEvent.keyCode == 226) ? !Zoom.settings.lockZoom : Zoom.settings.lockZoom,// Only change on keydown
                zoomFactor: Zoom.settings.zoomFactor
            };
           Zoom.updateZoom();
        },
        zommOnScroll: function(scrollEvent) {
            if (!W.gsc || Zoom.settings.ctrlDown || Zoom.settings.altDown || Zoom.settings.shiftDown) 
                return;
            if (scrollEvent.wheelDelta < 0)
                Zoom.zoomState.currentZoom++;
            else if (scrollEvent.wheelDelta > 0)
                Zoom.zoomState.currentZoom--;
            Zoom.updateZoom();
        },
        updateZoom: function(){
            if (!W.gsc)
                return;
            let zoomChangeFactor = Zoom.settings.lockZoom ? W.sgsc : Zoom.zoomState.currentZoom;
            if (Zoom.settings.shiftDown)
                zoomChangeFactor += 10;
            else if (Zoom.settings.ctrlDown)
                zoomChangeFactor -= 5;

            Zoom.zoomState.sigmoidMultiplier = Zoom.calculateSigmoid(zoomChangeFactor);
            Zoom.settings.zoomFactor = 0.9*Zoom.zoomState.sigmoidMultiplier;
            Zoom.updateZoomfactor();
        },
        calculateSigmoid: function(zoomChangeFactor){
            return -1.5/(Math.pow(Math.E, (-zoomChangeFactor/5.0))+1.0)+1.75;
        },
        updateZoomfactor: function(){
            W.gsc = Zoom.settings.zoomFactor;
        }
    };

    var DomManipulation ={

    };

    
    let startedPlaying = null;  
    /*
     * Methods listed below belong to the
     * User management and leaderboard functionality
     */
    function UserMethods(){
        // public
        let addHighscore = function(_score, _timePlayed){
            this.highscores = getAttribute(this, "highscores");
            // Init highscores, if not present
            this.highscores.push({
                score: _score,
                timePlayed: _timePlayed
            });
            // Sort highscores descending
            this.highscores.sort( (a, b) => b.score - a.score);
            // Save current skin
            this.skin = getAttribute(this, "skin");
            this.skin = typeof(localStorage.snakercv) === "undefined" ? this.skin : localStorage.snakercv;
            // Update lastPlayed
            this.lastPlayed = getAttribute(this, "lastPlayed");
            this.lastPlayed = Date.now();
        };
        let getGamesPlayed = function(){
            return getAttribute(this, "highscores").length;
        };
        let getBestScore = function(){
            return getAttribute(this, "highscores").length === 0 ? 0 : getAttribute(this, "highscores")[0].score;
        };
        let getAttribute = function(that, tag){
            // Try to access user.tag, if undefined create new
            // Useful if a new attribute has been added to User and old localStorage data is being used
            if(typeof(that[tag]) === 'undefined')
                that[tag] = newUser(that.name)[tag];
            return that[tag];
        };
        // private
        // Return public methods
        return {
            addHighscore: addHighscore,
            getGamesPlayed: getGamesPlayed,
            getBestScore: getBestScore,
            getAttribute: getAttribute
        };
    }

    function newUser(_name){
        return{
            highscores: [], // {score: 123, timePlayed: 456 (ms}
            lastPlayed: 0, // Gets a Date.now() timestamp each time when played
            name: _name,
            skin: 41
        };
    }
    function getUserList(){
        let userList = localStorage.getItem("userList");
        if(userList === null || userList === "null")
            return {};
        else
            return JSON.parse(userList);
    }
    function saveUserList(userList){
        localStorage.setItem("userList", JSON.stringify(userList));
    }
    function findUser(userName){
        let userList = getUserList();
        if(typeof(userList[userName]) !== "undefined")
            return userList[userName];
        return false;
    }
    // Get User with highest timestamp | todo: improve speed
    function getCurrentUser(){
        let userList = getUserList();
        let maxTimeStamp = -1, user = false;
        for(let userName in userList){
            let currentUser = userList[userName];
            let lastPlayed = UserMethods().getAttribute.bind()(currentUser, "lastPlayed"); // Ugly bunch of code.
            if(lastPlayed > maxTimeStamp){
                user = currentUser;
                maxTimeStamp = lastPlayed;
            }
        }
        return user;
    }
    function saveScore(userName, score){
        userName = userName.trim() === "" ? "default" : userName.trim();
        console.log("Saving score of " + score + " for player "+userName);
        let userList = getUserList();
        let user = findUser(userName);
        if(!user){
            console.log("Creating new user.");
            user = newUser(userName);
            console.log(user);
            userList[userName] = user;
        }
        UserMethods().addHighscore.bind(user)(score, Date.now() - startedPlaying);
        userList[user.name] = user;
        saveUserList(userList);
        console.log(userList);
        startedPlaying = null; // Make sure, results are not being saved multiple times
    }
    let gameRunning;
    function lookForGameEnd(){
       if(!W.playing && startedPlaying !== null){
           console.log("Finished playing..");
           clearInterval(gameRunning);
           let score = parseInt(W.lastscore.children[1].innerHTML);
           saveScore(W.my_nick, score);
       }
    }
    function startGame(){
        if(startedPlaying === null){
            console.log("Started playing..");
            startedPlaying = Date.now();
            gameRunning = setInterval(lookForGameEnd, 1000);
        }
    }
    function addListenerToPlayButton(){
        let initButtonInterval = setInterval(function(){
            if(typeof(W.play_btn) !== 'undefined'){ //W.document.querySelector("#playh > div > div > div.nsi") !== null){
                setTimeout(function(){
                    console.log("Initialized Start Button");
                    W.play_btn.btnf.addEventListener("click", startGame);
                    console.log("Current user:");
                    console.log(getCurrentUser());
                    if(getCurrentUser())
                        nick_holder.firstElementChild.value= getCurrentUser().name;
                }, 0);
                clearInterval(initButtonInterval);
            }
        }, 50);
    }
    SnakeScript.init();
})();

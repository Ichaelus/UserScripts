// ==UserScript==
// @name         SnakeZoom
// @namespace    https://github.com/Ichaelus/UserScripts
// @version      0.2
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
    let startedPlaying;
    
    let currentZoom = 0.0;
    let multiplier = 1.0;
    
    
    let settings = {
        ctrlDown: false,
        shiftDown: false,
        altDown: false,
        lockZoom: false,
        gsc: W.gsc
    };
    /*
     KEYMAP
     Shift | Zoom out a lot while pressed
     Strg  | Zoom out a little while pressed
     Alt   | Don't
     <     | Switch between current zoom and initial zoom
    */
    function updateZoom(){
        if (!W.gsc)
            return;
        let x = settings.lockZoom ? W.sgsc : currentZoom;
        if (settings.shiftDown)
            x += 20;
        else if (settings.ctrlDown)
            x += 10;

        multiplier = -1.5/(Math.pow(Math.E, (-x/10.0))+1.0)+1.75;
        settings.gsc = 0.9*multiplier;
        updateGSC();
    }

    // increment / decrement currentZoom based on wheel direction and delta
    function zoom(e) {
        if (!W.gsc || settings.ctrlDown || settings.altDown || settings.shiftDown) {
            return;
        }
        if (e.wheelDelta < 0){
            currentZoom++;
        }
        else if (e.wheelDelta > 0){
            currentZoom--;
        }
        updateZoom();
    }

    function keyPressed(e){
        if (W.gsc)
            updateSettings(e, true);
    }

    function keyReleased(e){
        if (W.gsc)
            updateSettings(e, false);
    }

    function updateSettings(keyEvent, isKeyDown){
        settings = {
     //       ctrlDown:  isKeyDown && keyEvent.keyCode == 17,
            shiftDown: isKeyDown && keyEvent.keyCode == 16,
       //     altDown:   isKeyDown && keyEvent.keyCode == 18,
            lockZoom:  (isKeyDown && keyEvent.keyCode == 226) ? !settings.lockZoom : settings.lockZoom,// Only change on keydown
            gsc: settings.gsc
        };
        //if([16, 17, 18, 226].indexOf(keyEvent.keyCode))
           updateZoom();
    }
    function updateGSC(){
        W.gsc = settings.gsc;
    }
    W.addEventListener("mousewheel", zoom, false);
    W.addEventListener("keydown", keyPressed, false);
    W.addEventListener("keyup", keyReleased, false);
    //window.onmousewheel = zoom;
    //window.onkeydown = keyPressed;
    //window.onkeyup = keyReleased;
    setInterval(updateGSC, 10);
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
        };
        let getGamesPlayed = function(){
            return getAttribute(this, "highscores").length;
        };
        let getBestScore = function(){
            return getAttribute(this, "highscores").length === 0 ? 0 : getAttribute(this, "highscores")[0].score;
        };
        // private
        let getAttribute = function(that, tag){
            // Try to access user.tag, if undefined create new
            // Useful if a new attribute has been added to User and old localStorage data is being used
            if(typeof(that[tag]) === 'undefined')
                that[tag] = newUser(that.name)[tag];
            return that[tag];
        };
        // Return public methods
        return {
            addHighscore: addHighscore,
            getGamesPlayed: getGamesPlayed,
            getBestScore: getBestScore
        };
    }
    function newUser(_name){
        return{
            name: _name,
            highscores: [] // {score: 123, timePlayed: 456 (ms}
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
    }
    let gameRunning;
    function lookForGameEnd(){
       if(!W.playing){
           console.log("Finished playing..");
           clearInterval(gameRunning);
           let score = parseInt(W.lastscore.children[1].innerHTML);
           saveScore(W.my_nick, score);
       }
    }
    function startGame(){
        console.log("Started playing..");
        startedPlaying = Date.now();
        gameRunning = setInterval(lookForGameEnd, 1000);
    }
    function addListenerToPlayButton(){
        let initButtonInterval = setInterval(function(){
            if(document.querySelector("#playh > div > div > div.nsi") !== null){
                setTimeout(function(){
                    console.log("Initialized Start Button");
                    document.querySelector("#playh > div > div > div.nsi").addEventListener("click", startGame);
                }, 100);
                clearInterval(initButtonInterval);
            }
        }, 50);
    }
    addListenerToPlayButton();
})();
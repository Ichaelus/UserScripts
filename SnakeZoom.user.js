// ==UserScript==
// @name         SnakeZoom
// @namespace    https://github.com/Ichaelus/UserScripts
// @version      0.4.1
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
        gameStartedTimestamp: null,
        gameRunning: null,
        currentScore: 0,
        init: function(){
            Zoom.init();
            DataHandler.restoreCurrentUser();
            DomManipulation.init();
        },
        startGame: function(){
            if(SnakeScript.gameStartedTimestamp === null){
                console.log("Wanting to play");
                SnakeScript.gameStartedTimestamp = Date.now();
                SnakeScript.lookForGameStarted();
            }
        },
        lookForGameStarted: function(){
            if(W.playing){
                console.log("Started playing..");
                SnakeScript.gameRunning = setInterval(SnakeScript.lookForGameEnd, 40);
            }else
                setTimeout(SnakeScript.lookForGameStarted, 50);
        },
        lookForGameEnd: function(){
            if(!W.playing && SnakeScript.gameStartedTimestamp!== null){
                console.log("Finished playing..");
                clearInterval(SnakeScript.gameRunning);
                //let score = parseInt(W.lastscore.children[1].innerHTML);
                DataHandler.saveScore(W.my_nick, SnakeScript.currentScore);
                DomManipulation.displayUserStatistics();
            }else{
                if(typeof(snake) !== "undefined" && typeof(fpsls) !== 'undefined')
                    SnakeScript.currentScore = Math.floor(15 * (fpsls[snake.sct] + snake.fam / fmlts[snake.sct] - 1) - 5) / 1;
            }
        }
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

    var DomManipulation = {
        currentUserIndex: 0,
        init: function(){
            let initButtonInterval = setInterval(function(){
                if(typeof(W.play_btn) !== 'undefined'){
                    setTimeout(function(){
                        console.log("Initialized DOM");
                        DomManipulation.addListenerToPlayButton();
                        DomManipulation.displayPlayerName();
                        DomManipulation.addPlayerSwitching();
                    }, 0);
                    clearInterval(initButtonInterval);
                }
            }, 50);
        },
        addListenerToPlayButton: function(){
            W.play_btn.btnf.addEventListener("click", SnakeScript.startGame);
        },
        displayPlayerName: function() {
            W.nick_holder.firstElementChild.value = User.currentUser.name;
            DomManipulation.displayUserStatistics();
        },
        addPlayerSwitching: function(){
            let arrowStyles = "cursor: pointer;left: 110px;color: #d8d7f8;position: absolute;";
            W.nick_holder.insertAdjacentHTML("beforeend", "<div alt='Select previous player'  id='switch_previous_player' style='"+arrowStyles+"top:-2px;'>         &#9650;</div>");
            W.nick_holder.insertAdjacentHTML("beforeend", "<div alt='Select next player'      id='switch_next_player'     style='"+arrowStyles+"bottom:-2px;'>      &#9660</div>");
            W.document.getElementById("switch_previous_player").addEventListener("click", DomManipulation.switchToPreviousPlayer.bind(DomManipulation));
            W.document.getElementById("switch_next_player")    .addEventListener("click", DomManipulation.switchToNextPlayer.bind(DomManipulation));
        },
        switchToPreviousPlayer(){
            DomManipulation.currentUserIndex --;
            DomManipulation.switchPlayer();
        },
        switchToNextPlayer(){
            DomManipulation.currentUserIndex ++;
            DomManipulation.switchPlayer();
        },
        switchPlayer: function () {
            console.log("Switching player");
            User.setCurrentUser(DataHandler.getUserByTimestamp(DomManipulation.currentUserIndex));
            DomManipulation.displayPlayerName();
        },
        displayUserStatistics: function(){
            if(document.getElementById('userStats') === null){
            let wrapperStyles = "color: white;\
                                 font-family: Lucia Sans Unicode, Lucia Grande, sans-serif;\
                                 padding: 0;\
                                 width: 200px;\
                                 position: relative;\
                                 margin: 0px auto;\
                                 list-style: none;";
                let statisticNode = '<ul id="userStats" style="'+wrapperStyles+'"></ul>';
                W.play_btn.elem.parentElement.insertAdjacentHTML("afterend", statisticNode);
            }
            document.getElementById('userStats').innerHTML = DomManipulation.transformStatisticsToRows();
            //play_btn.elem.parentElement.nextSibling.insertBefore(new DOMParser().parseFromString("<ol/>", "text/xml").getElementsByTagName("ol")[0],play_btn.elem.parentElement.nextSibling);
        },
        transformStatisticsToRows: function(){
            let printableValues = [
                {title: "Highscore", value: User.getBestScore()},
                {title: "Games played", value: User.getGamesPlayed()},
                {title: "Minutes played", value: User.getMinutesPlayed()},
                {title: "&#216;	score per game", value: User.getAverageScore()},
                {title: "&#216;	score per minute", value: User.getScorePerMinutesPlayed()}
            ];
            let DOMString = "";
            for(let attribute in printableValues)
                DOMString += '<li style="clear:both;"><strong style="float: left;">'+printableValues[attribute].title+':</strong><span style="float: right;">'+printableValues[attribute].value+'</span></li>';
            return DOMString;
        }
    };


    var User = {
        currentUser: null,
        newUser: function(_name){
            return{
                highscores: [], // {score: 123, timePlayed: 456 (ms}
                lastPlayed: 0, // Gets a Date.now() timestamp each time when played
                name: _name,
                skin: 41
            };
        },
        addHighscore: function(_score, _timePlayed){
            User.pushToAttribute("highscores", {
                score: _score,
                timePlayed: _timePlayed
            });
            // Sort highscores descending
            User.currentUser.highscores.sort((firstHighscore, secondHighscore) => secondHighscore.score - firstHighscore.score);
            User.setAttribute("skin", typeof(localStorage.snakercv) === "undefined" ? User.getAttribute("skin") : localStorage.snakercv);
            console.log(typeof(localStorage.snakercv) === "undefined" ? User.getAttribute("skin") : localStorage.snakercv);
            User.setAttribute("lastPlayed", Date.now());
        },
        getGamesPlayed: function(){
            return User.getAttribute("highscores").length;
        },
        getBestScore: function(){
            return User.getAttribute("highscores").length === 0 ? 0 : User.getAttribute("highscores")[0].score;
        },
        getAverageScore: function(){
            if(User.getGamesPlayed() === 0)
                return 0;
            return Math.round(User.getTotalScore() / User.getGamesPlayed());
        },
        getTotalScore: function(){
            let games = User.getAttribute("highscores"),
                sum = 0;
            for(let game in games)
                sum += games[game].score;
            return sum;
        },
        getMinutesPlayed: function(){
            let games = User.getAttribute("highscores"),
                sum = 0;
            for(let game in games)
                sum += games[game].timePlayed;
            return Math.round(sum / 60000);
        },
        getScorePerMinutesPlayed: function(){
           if(User.getMinutesPlayed() === 0)
               return 0;
            return Math.round(User.getTotalScore() / User.getMinutesPlayed());
        },
        getAttribute: function(attributeName){
            User.initAttribute(attributeName);
            return User.currentUser[attributeName];
        },
        setAttribute: function(attributeName, value){
            User.initAttribute(attributeName);
            User.currentUser[attributeName] = value;
        },
        pushToAttribute: function(attributeName, value){
            User.initAttribute(attributeName);
            User.currentUser[attributeName].push(value);
        },
        initAttribute: function(attributeName){
            // Try to access user.attributeName, if undefined create new
            // Useful if a new attribute has been added to User and old localStorage data is being used
            if(typeof(User.currentUser[attributeName]) === 'undefined')
                User.currentUser[attributeName] = User.newUser(User.currentUser.name)[attributeName];
        },
        getCurrentUser: function(){
            return User.currentUser;
        },
        setCurrentUser: function(user){
            User.currentUser = user;
            localStorage.snakercv = User.getAttribute("skin");
        },
        temporarySetCurrentUser: function(user){
            User.currentUser = user;
        }
    };
    var DataHandler = {
        getUserList: function(){
            let userList = localStorage.getItem("userList");
            if(userList === null || userList === "null")
                return {};
            else
                return JSON.parse(userList);
        },
        saveUserList: function(userList){
            localStorage.setItem("userList", JSON.stringify(userList));
        },
        findUser: function(userName){
            let userList = DataHandler.getUserList();
            if(typeof(userList[userName]) !== "undefined")
                return userList[userName];
            return false;
        },
        saveScore: function(userName, score){
            userName = userName.trim() === "" ? "default" : userName.trim();
            console.log("Saving score of " + score + " for player "+userName);
            let userList = DataHandler.getUserList();
            let user = DataHandler.findUser(userName);
            if(!user){
                console.log("Creating new user.");
                user = User.newUser(userName);
                userList[userName] = user;
            }
            User.temporarySetCurrentUser(user);
            User.addHighscore(score, Date.now() - SnakeScript.gameStartedTimestamp);
            userList[user.name] = User.getCurrentUser();
            DataHandler.saveUserList(userList);
            console.log(userList);
            SnakeScript.gameStartedTimestamp= null; // Make sure, results are not being saved multiple times
        },
        restoreCurrentUser: function(){
            User.setCurrentUser(DataHandler.getUserByTimestamp(0));
        },
        getUserByTimestamp: function(userIndex){
            let userList = DataHandler.getUserList();
            let orderedUsers = DataHandler.getUserNamesByLastPlayed();
            if(orderedUsers.length === 0)
                return User.newUser("");
            userIndex = Math.max(0, (orderedUsers.length + userIndex) % orderedUsers.length);
            return userList[orderedUsers[userIndex]];
        },
        getUserNamesByLastPlayed: function(){
            let userList = DataHandler.getUserList();
            return Object.keys(userList).sort(
                function(user1, user2) {
                    if(typeof(userList[user2].lastPlayed) === 'undefined')
                        return -1;
                    else if(typeof(userList[user1].lastPlayed) === 'undefined')
                        return 1;
                    else
                        return userList[user2].lastPlayed - userList[user1].lastPlayed;
                }
            );
        }
    };
    SnakeScript.init();
})();


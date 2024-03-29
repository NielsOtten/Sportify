var songInfo        = [];
songInfo[0]         = [];
songInfo[1]         = [];
var listItems       = [];
var rightSongs      = [];
// rightSongs[0]       = [];
// rightSongs[1]       = [];
var playlist        = [];

var loading         = false;
var connectionToast;
var genreJSON,
countFirstCall,
arrayToPush;
var intervalIteration = 1;
var allAttributes = [];
setBasicAttributes ();

function setBasicAttributes () {
    allAttributes = 
    [
        "api_key=HKQMBXE16TWEM1BZ3",
        "format=json",
        "results=100",
        "bucket=tracks",
        "bucket=id:spotify",
        "song_type=studio"
    ];
}

function validateDurAndBpm () {
    removeAttributes();
    setBasicAttributes();

    var duration = $("#duration").val();
    var bpm      = $("#bpm").val();
    if (duration == "" || bpm == "" || !$.isNumeric(duration) || !$.isNumeric(bpm) || typeof duration === undefined || typeof bpm === undefined || duration > 180 || duration < 5) {
        toast("Graag alleen getallen invoeren. Duur mag minimaal 5 en maximaal 180 zijn.", 4000);
        return false;
    }
    else {
        localStorage.duration   = duration * 60000;
        localStorage.bpm        = bpm;
        $(".choose-training").each(function () {
            if (this.checked) {
                localStorage.trainingType = $(this).attr("value");
            }
        });
        if (localStorage.trainingType == "standaardtraining") {
           allAttributes.push("min_tempo=" + (parseInt(localStorage.bpm) - 3), "max_tempo=" + (parseInt(localStorage.bpm) + 3), "min_energy=0.7");
        }
        return true;     
    }
}

function validateIntervalTraining () {
    // Validation
    if (true) {
       localStorage.intervalScheme = JSON.stringify(scheme);
       localStorage.bpmOne = $("#bpmOne").val();
       localStorage.bpmTwo = $("#bpmTwo").val();
       return true;
    }
    else {
        // Error
    }
}

function getItems (searchType, getDisplayText, e) {
    if (!loading) {
        loading = true;
        $.ajax({
            data: {
                searchType: searchType,
                query:      $('.searchItems').val()
            },
            method:     "post",
            url:        "includes/searchitems.php",
            dataType:   "json",
            success: function (output) {
                showAllItems (output, getDisplayText);
                loading = false;
            }
        });
    }
}

function showAllItems (data, getDisplayText) {
    $("ul.result-list").empty();
    if (data.results.length > 0) {
        $.each(data.results, function (k, v) {
            var decodedName;
            $.ajax({
                data: {
                    stringToDecode: v.name
                },
                dataType: "text",
                method: "post",
                url: "includes/decodestring.php",
                success: function (output) {
                    decodedName = output;
                    if ($('ul.chosen-list li input[id="' + decodedName + '"]').length == 0) {
                        listItems[listItems.length] = v;
                        var labelText = truncateText (getDisplayText(v));
                        $("ul.result-list").append($("<li>")
                            .append($("<input>", {
                                id: decodedName, 
                                value: JSON.stringify(v), 
                                type: "checkbox"
                            }))
                            .append($("<label>", {
                                html: labelText, 
                                for: decodedName, 
                                    class: "clickable"
                            })));
                    }
                }
            })
        });
    }
    else {
        $("ul.result-list").append($("<li>", {text: "Geen " + $('.searchItems').attr("data-type") + " gevonden."}));
    }
}

function addToChosenList (e) {
    chosenItems = $('.chosen-list li').size();
    var checked = $(this).parent(); // Get parent li
    if (chosenItems + 1 > 5) {
        e.preventDefault();
        toast("Oeps! Je kunt maximaal vijf " + $('.searchItems').attr("data-type") + " tegelijk kiezen!", 4000)
    }
    else {
        $('.clickable').removeClass("clickable").addClass("not-clickable");
        setTimeout(function () {
            if ($('ul.chosen-list li input[id="' + checked.find("input").attr("id") + '"]').length == 0) {
                checked.appendTo($("ul.chosen-list"));
                $('.not-clickable').removeClass("not-clickable").addClass("clickable");
            }  
        }, 300);
    }
}

function removeFromChosenList () {
    var unchecked = $(this).parent(); // Get parent li
    setTimeout(function () {
        unchecked.remove();
        var searchId = $('.searchItems').attr("id");
        getItems (searchId.substring(6, searchId.length).toLowerCase(), searchDisplayText)
    }, 200);
    chosenItems = $('.chosen-list li').size();
}

function pushToChosen () {
    chosen = [];
        $("ul.chosen-list input[type='checkbox']").each(function() {
            if (this.checked) {
                var jsonValue = JSON.parse($(this).val());
                chosen.push(jsonValue);
            }
        });
    typeSwitch();
    return true;
}

function typeSwitch () {
    switch ($('.searchItems').attr("data-type")) {
        case "genres":
            addGenresToCallInfo();
            break;
        case "artiesten":
            addArtistsToCallInfo();
            break;
    }
}

Array.min = function (array) {
    return Math.min.apply(Math, array);
};

function addGenresToCallInfo () {
    $.when(removeAttributes).then(function(){    
        if (chosen.length > 0) {
            
            var artist_hots = [];

            $.each(chosen, function (k, v) {
                allAttributes.push("genre=" + v.name);
                artist_hots.push(v.artist_hot);
            });

            var artist_hotttnesss = "artist_min_hotttnesss=" + Array.min(artist_hots); 

            allAttributes.push("type=genre-radio", artist_hotttnesss);
            makeURL();
        }
        else {
            skipPersonalMusic ();
        }
    });
}

function removeAttributes () {
    var indexesToRemove = [];
    chosen = [];
    $.each(allAttributes, function (k, v) {
        if (v.indexOf("genre") > -1 || v.indexOf("artist") > -1) {
            if (v.indexOf("genre") > -1) {
                indexesToRemove.push(k);
            }
            else {
                indexesToRemove.push(k);
            }
        }
    });
    indexesToRemove.reverse();
    $.each(indexesToRemove, function (k, v) {
        spliceFromAttributes(v);
    });
    return true;
}

function spliceFromAttributes (indexToRemove) {
    allAttributes.splice(indexToRemove, 1);
}

function addArtistsToCallInfo () {
    $.when(removeAttributes).then(function(){
        if (chosen.length == 0) {
            chosen.push({"name": "Katy Perry"}, {"name": "Ed Sheeran"});
        }
        $.each(chosen, function (k, v){
            allAttributes.push("artist=" + v.name.replace("&", "%26"));
        });
        allAttributes.push("type=artist-radio");
        makeURL();
        return true;
    });
}

function skipPersonalMusic () {
    if (chosen.length == 0) {
        chosen.push("pop", "genre");
        allAttributes.push("type=genre-radio", "genre=pop", "genre=house");
        makeURL();
    }
}

function makeURL () {
    var base = "http://developer.echonest.com/api/v4/playlist/static?";
    var url = base + allAttributes.join("&");
    if (localStorage.trainingType == "intervaltraining") {
        if (intervalIteration === 1) {
            if (parseInt(localStorage.bpmTwo >= 100)) {
                url += "&min_energy=0.7";
            }
            var schemeDurations = [];
            $.each(scheme, function (k, v) {
                if (v[0] == 2) {
                    schemeDurations.push(v[1]);
                }
            })
            var extendedUrl = url + "&min_tempo=" + (parseInt(localStorage.bpmTwo) - 3) + "&max_tempo=" + (parseInt(localStorage.bpmTwo) + 3); 
            if (((Array.min(schemeDurations) / 1000) + 10) < 300) {
                extendedUrl += "&max_duration=" + ((Array.min(schemeDurations) / 1000) + 10); 
            }
            getPlaylist(extendedUrl);
        }
        else if (intervalIteration === 2) { 
            if (parseInt(localStorage.bpmTwo >= 100)) {
                url += "&min_energy=0.7";
            }
            var schemeDurations = [];
            $.each(scheme, function (k, v) {
                if (v[0] == 1) {
                 schemeDurations.push(v[1]);
                }
            })
            var extendedUrl = url + "&min_tempo=" + (parseInt(localStorage.bpmOne) - 3) + "&max_tempo=" + (parseInt(localStorage.bpmOne) + 3) + "&max_duration=" + ((Array.min(schemeDurations) / 1000) + 10);   
            getPlaylist(extendedUrl);

        }
    }
    else {
        getPlaylist(url);
    }
}

function getPlaylist (callURL) {
    localStorage.callEchonest = callURL;
    $.ajax({
        url: callURL,
        cache: false,
        success: function (output) {
           pushOutputToSongsArray (output);
        }
    });
}

function pushOutputToSongsArray (output) {
    if (output.response.songs.length > 0) {
        if (localStorage.trainingType == "intervaltraining") {
            if (intervalIteration === 1) {
                intervalIteration = 2;
                makeURL ();
                countFirstCall = songInfo.length;
                $.each(output.response.songs, function (key, value) {
                    if (value.tracks.length > 0) {
                        var foundTrack = false;
                        var trackId;
                        $.each(value.tracks, function (k, v) {
                            if (typeof v.foreign_id != typeof undefined && v.foreign_id != "") {
                                trackId = value.tracks[k].foreign_id.slice(14);
                                foundTrack = true;
                            }
                        })
                        if (foundTrack)
                            songInfo[1].push(trackId);
                    }
                });
            }
            else if (intervalIteration === 2) {
                $.each(output.response.songs, function (key, value) {
                    if (value.tracks.length > 0) {
                        var foundTrack = false;
                        var trackId;
                        $.each(value.tracks, function (k, v) {
                            if (typeof v.foreign_id != typeof undefined && v.foreign_id != "") {
                                trackId = value.tracks[k].foreign_id.slice(14);
                                foundTrack = true;
                            }
                        })
                        if (foundTrack)
                            songInfo[0].push(trackId);
                    }
                });
                findSpotifyEquivalents ();
            };
        }
        else {
            $.each(output.response.songs, function (key, value) {
                if (value.tracks.length > 0) {
                    var foundTrack = false;
                    var trackId;
                    $.each(value.tracks, function (k, v) {
                        if (typeof v.foreign_id != typeof undefined && v.foreign_id != "") {
                            trackId = value.tracks[k].foreign_id.slice(14);
                            foundTrack = true;
                        }
                    })
                    if (foundTrack)
                        songInfo[0].push(trackId);
                }
            });
            findSpotifyEquivalents ();
        }
    }
    else {
        console.error("Geen liedjes gevonden");
    }   
}

function getSeveralTracks (ids, arrayToUse) {
    var spotifyAPIBase = "https://api.spotify.com/v1/tracks/?market=NL&ids=";
    var output;
    return $.ajax({
        url: spotifyAPIBase + ids,
        dataType: "json",
        success: function (output) {
            validateSpotifySongs(output, arrayToUse);
        }
    })
}

function validateSpotifySongs (songs, arrayToUse) {
    var validatedSongs = [];
    $.each(songs.tracks, function () {
        if (this.album.images.length == 3) {
            var artistnames = [];
            $.each(this.artists, function (k, v) {
                artistnames.push(v.name);
            })
            arrayToUse.push([this.id, artistnames.join(", "), this.name, this.duration_ms, this.preview_url, this.album.images[2].url]);
        };
    })
}

function findSpotifyEquivalents () {
    connectionToast = setTimeout(function () {toast("Je internet snelheid is niet optimaal, het kan iets langer duren dan normaal.", 60000)}, 8000);
    rightSongs[0] = [];
    if (songInfo[0].length > 50) {
        getSeveralTracks(songInfo[0].slice(0, 50).join(","), rightSongs[0]);
        if (localStorage.trainingType == "intervaltraining")
            getSeveralTracks(songInfo[0].slice(51, songInfo[0].length).join(","), rightSongs[0]);
        else
            $.when(getSeveralTracks(songInfo[0].slice(51, songInfo[0].length).join(","), rightSongs[0])).then(generatePlaylist);
    }
    else {
        if (localStorage.trainingType == "intervaltraining")
            getSeveralTracks(songInfo[0].join(","), rightSongs[0]);
        else (localStorage.trainingType == "intervaltraining")
            $.when(getSeveralTracks(songInfo[0].join(","), rightSongs[0])).then(generatePlaylist);
    }

    if (localStorage.trainingType == "intervaltraining") {
        rightSongs[1] = [];
        if (songInfo[1].length > 50) {
            getSeveralTracks(songInfo[1].slice(0, 50).join(","), rightSongs[1]);
            $.when(getSeveralTracks(songInfo[1].slice(51, songInfo[0].length).join(","), rightSongs[1])).then(generatePlaylist);
        }
        else
            $.when(getSeveralTracks(songInfo[1].join(","), rightSongs[1])).then(generatePlaylist);

    }



    // i++;
    // setProgressBar (0.5, i);
    // if (i == length) generatePlaylist();












    // var spotifyAPIBase = "https://api.spotify.com/v1/search?limit=1&market=NL&type=track&q=";
    // connectionToast = setTimeout(function () {toast("Je internet snelheid is niet optimaal, het kan iets langer duren dan normaal.", 60000)}, 8000);
    // rightSongs[0] = [];
    // if (localStorage.trainingType == "intervaltraining") {
    //     rightSongs[1] = [];
    // }

    // if (localStorage.trainingType == "intervaltraining") {
    //     var i = 0;
    //     var length = songInfo[0].length + songInfo[1].length;
    //     $.each(songInfo[0], function (k, v) {
    //         var info    = v[0] + " " + v[1];
    //         var query   = info.replace(" ", "+");
    //         $.ajax({
    //             url: spotifyAPIBase + query,
    //             success: function (output) {
    //                 console.log(output);
    //                 if ("items" in output.tracks && output.tracks.items.length != 0 && output.tracks.items[0].album.images.length == 3) {
    //                     pushToRightSongs (rightSongs[0], [output.tracks.items[0].id, v[0], v[1], output.tracks.items[0].duration_ms, output.tracks.items[0].preview_url, output.tracks.items[0].album.images[2].url]);
    //                 };
    //                 i++;
    //                 setProgressBar (0.5, i);
    //                 if (i == length) generatePlaylist();
    //             },
    //             error: function (output) {
    //                 console.log("error: ")
    //                 console.log(output);
    //             }
    //         })
    //         // $.getJSON(spotifyAPIBase + query, function(data) {
    //         //     if ("items" in data.tracks && data.tracks.items.length != 0 && data.tracks.items[0].album.images.length == 3) {
    //         //         pushToRightSongs (rightSongs[0], [data.tracks.items[0].id, v[0], v[1], data.tracks.items[0].duration_ms, data.tracks.items[0].preview_url, data.tracks.items[0].album.images[2].url]);
    //         //     };
                
    //         // });
    //     });
    //     $.each(songInfo[1], function (k, v) {
    //         var info    = v[0] + " " + v[1];
    //         var query   = info.replace(" ", "+");
    //         $.ajax({
    //             url: spotifyAPIBase + query,
    //             success: function (output) {
    //                 console.log(output);
    //                 if ("items" in output.tracks && output.tracks.items.length != 0 && output.tracks.items[0].album.images.length == 3) {
    //                     pushToRightSongs (rightSongs[1], [output.tracks.items[0].id, v[0], v[1], output.tracks.items[0].duration_ms, output.tracks.items[0].preview_url, output.tracks.items[0].album.images[2].url]);
    //                 };
    //                 i++;
    //                 setProgressBar (0.5, i);
    //                 if (i == length) generatePlaylist();
    //             },
    //             error: function (output) {
    //                 console.log("error: ");
    //                 console.log(output);
    //             }
    //         })
    //         // $.getJSON(spotifyAPIBase + query, function(data) {
    //         //     if ("items" in data.tracks && data.tracks.items.length != 0 && data.tracks.items[0].album.images.length == 3) {
    //         //         pushToRightSongs (rightSongs[1], [data.tracks.items[0].id, v[0], v[1], data.tracks.items[0].duration_ms, data.tracks.items[0].preview_url, data.tracks.items[0].album.images[2].url]);
    //         //     };
    //         //     i++;
    //         //     setProgressBar (0.5, i);
    //         //     if (i == length) generatePlaylist();
    //         // });
    //     });
    // }
    // else {
    //     var i = 0;
    //     var length = songInfo[0].length;
    //     $.each(songInfo[0], function (k, v) {
    //         var info    = v[0] + " " + v[1];
    //         var query   = info.replace(" ", "+");
    //         $.getJSON(spotifyAPIBase + query, function(data) {
    //             console.log(data);               
    //             if ("items" in data.tracks && data.tracks.items.length != 0 && data.tracks.items[0].album.images.length == 3) {
    //                 var artists = [];
    //                 $.each(data.tracks.items[0].artists, function (k, v) {
    //                     artists.push(v.name);
    //                 });
    //                 artists = artists.join(", ");
    //                 pushToRightSongs (rightSongs[0], [data.tracks.items[0].id, artists, v[1], data.tracks.items[0].duration_ms, data.tracks.items[0].preview_url, data.tracks.items[0].album.images[2].url])
    //             };
    //             i++;
    //             setProgressBar (1, i);
    //             if (i == length) generatePlaylist();
    //         });
    //     });
    // }
}

function setProgressBar (times, count) {
    var newPercentage = count * times;
    $("#loading-playlist-bar .determinate").css("width", newPercentage + "%");
}

function pushToRightSongs (arrayToPush, dataToPush) {
    arrayToPush.push(dataToPush);
}

function generatePlaylist () {
    clearTimeout(connectionToast);
    $(".toast").remove();
    $("#loading-playlist-bar .determinate").css("width", "100%");
    var playtime = 0;
    var duration = parseInt(localStorage.duration);
    if (localStorage.trainingType == "intervaltraining") {
        var intervalScheme = JSON.parse(localStorage.intervalScheme);
        var chosenIndexesOne = [];
        var chosenIndexesTwo = [];
        $.each(intervalScheme, function (k, v) {
            playtime = 0;
            if (v[0] == 2) {
                for (var i = 0; i < rightSongs[1].length - 1; i++) {
                    if (i < rightSongs[1].length - 1 && playtime + rightSongs[1][i][3] < v[1] + 10000 && chosenIndexesOne.indexOf(i) == -1) {
                        pushToPlaylist (i, 1, k);
                        playtime += rightSongs[1][i][3];
                        chosenIndexesOne.push(i);
                    }
                }
            }
            else {
               for (var i = 0; i < rightSongs[0].length - 1; i++) {
                    if (i < rightSongs[0].length - 1 && playtime + rightSongs[0][i][3] < v[1] + 10000 && chosenIndexesTwo.indexOf(i) == -1) {
                        pushToPlaylist (i, 0, k);
                        playtime += rightSongs[0][i][3];
                        chosenIndexesTwo.push(i);
                    }
                }
            }
        });
    }
    else {
        $.each(rightSongs[0], function (k, v) {
            if (playtime + v[3] < duration + 30000) {
                playlist.push([v, k, 0]);
                playtime += v[3];
            }
        });
    };

    localStorage.rightSongs = JSON.stringify(rightSongs);
    localStorage.playlist   = JSON.stringify(playlist);
    setTimeout(function () {
        nextPage(13, "slide");
    }, 0);
}

function pushToPlaylist (indexInArray, indexToUse, key) {
    playlist.push([rightSongs[indexToUse][indexInArray], indexInArray, key])
}

'use strict';

///// State /////

var dictionary = {};  // keyed by kanji

var original_deck = "";  // Deck as first created, unshuffled
var deck = "";  // Current deck, shuffled
var correct = "";  // Keep these to make the user proud
var incorrect = "";  // Preserve for the next shuffle
 // Deck is indexed by correct.length + incorrect.length :)
var flipped = false;  // Currently not saved in localStorage.  TODO: make it be.

var show_tutorial = true;

var deck_builder = false;

///// Actions /////

function create_deck () {
    original_deck = "";
     // Search deck builder for all selected kanji
    var selected = $(".grade-select > div.use");
    for (var i = 0; i < selected.length; i++) {
        if (selected[i].textContent in dictionary)
            original_deck += selected[i].textContent;
    }
    deck = shuffle(original_deck.split("")).join("");
    correct = "";
    incorrect = "";
    save_deck();
    draw();
}

function start_deck_builder () {
    deck_builder = true;
    $("#control-hider")[0].checked = false;
    update_display();
}
function stop_deck_builder () {
    deck_builder = false;
    update_display();
}

function draw () {  // As in draw a card, not as in draw a picture
    if (deck_builder) return;
    flipped = false;
    update_display();
}

function flip () {
    if (deck_builder) return;
    flipped = true;
    update_display();
}

function yes () {
    if (deck_builder) return;
    if (!flipped) return true;
    correct += deck[correct.length + incorrect.length];
    show_tutorial = false;
    save_deck();
    draw();
    return false;  // Prevent click from cascading to flip()
}
function no () {
    if (deck_builder) return;
    if (!flipped) return true;
    incorrect += deck[correct.length + incorrect.length];
    show_tutorial = false;
    save_deck();
    draw();
    return false;
}

function undo () {
    if (deck_builder) return;
    var deck_i = correct.length + incorrect.length;
    if (deck_i == 0) return;
    correct = correct.replace(deck[deck_i-1], "");
    incorrect = incorrect.replace(deck[deck_i-1], "");
    save_deck();
    draw();
    return false;
}

function continue_ () {
    if (deck_builder) return;
    deck = shuffle(incorrect.split("")).join("");
    correct = "";
    incorrect = "";
    save_deck();
    draw();
    return false;
}

function start_over () {
    if (deck_builder) return;
    deck = shuffle(original_deck.split("")).join("");
    correct = "";
    incorrect = "";
    save_deck();
    draw();
    return false;
}

function import_deck () {
    var text = $("#import-text").val();
    var have = {};
    for (var i = 0; i < text.length; i++) {
        if (text[i] in dictionary) {
            have[text[i]] = true;
        }
    }
    var selects = $(".grade-select > div");
    for (var i = 0; i < selects.length; i++) {
         // This feels a bit flimsy
        if ((selects[i].textContent in have) != (selects[i].className == "use")) {
            $(selects[i]).click();
        }
    }
}

function export_deck () {
    var text = "";
    var selected = $(".grade-select > div.use");
    for (var i = 0; i < selected.length; i++) {
        if (selected[i].textContent in dictionary)
            text += selected[i].textContent;
    }
    $("#import-text").val(text);
}


///// Display /////

 // For change-optimization only
var current = "";

function update_display () {
    function show_if_checked (elem, check) {
        if ($(check)[0].checked) {
            $(elem).removeClass("hidden");
        }
        else {
            $(elem).addClass("hidden");
        }
    }
    var deck_i = correct.length + incorrect.length;
    if (deck_builder) {  // Show deck builder
        $("#card, #finished").addClass("hidden");
        $("#deck-builder").removeClass("hidden");
        $("#buttons, #screen-areas").addClass("hidden");
        $("#screen").removeClass("clickable");
        $("#status").addClass("hidden");
    }
    else if (deck_i == deck.length) {  // Show finished screen
        $("#card, #deck-builder").addClass("hidden");
        $("#finished").removeClass("hidden");
        $("#buttons, #screen-areas").addClass("hidden");
        $("#screen").removeClass("clickable");
        $("#status").html("おつかれさまでした！").removeClass("hidden");
        $("#incorrect-label").text("✕ " + incorrect.length);
        $("#incorrect").text(incorrect);
        $("#correct-label").text("〇 " + correct.length);
        $("#correct").text(correct);
        $("#continue")[0].disabled = incorrect.length == 0;  // No sense continuing with an empty deck
    }
    else {  // Show card
        $("#finished, #deck-builder").addClass("hidden");
        $("#card").removeClass("hidden");
        if (deck[deck_i] != current) {
            current = deck[deck_i];
            var def = dictionary[deck[deck_i]];
            $("#kanji").html(def.kanji);
            $("#on-yomi").html(def.onyomi);
            $("#kun-yomi").html(def.kunyomi);
            $("#nanori").html(def.nanori);
            $("#meanings").html(def.meanings);
        }
        if (show_tutorial) {
            if (!flipped)
                $("#status").text("Make a guess and click anywhere to check the answer.").removeClass("hidden");
            else {
                $("#status").text("Was your guess correct?").removeClass("hidden");
            }
        }
        else {
            $("#status").text("").addClass("hidden");
        }
         // Select which fields are visible
        if (!flipped) {  // front
            show_if_checked("#kanji", "#front-kanji");
            show_if_checked("#on-yomi", "#front-on-yomi");
            show_if_checked("#kun-yomi", "#front-kun-yomi");
            show_if_checked("#nanori", "#front-nanori");
            show_if_checked("#meanings", "#front-meanings");
            $("#buttons, #screen-areas").addClass("hidden");
            $("#screen").addClass("clickable");
        }
        else {  // back
            show_if_checked("#kanji", "#back-kanji");
            show_if_checked("#on-yomi", "#back-on-yomi");
            show_if_checked("#kun-yomi", "#back-kun-yomi");
            show_if_checked("#nanori", "#back-nanori");
            show_if_checked("#meanings", "#back-meanings");
            $("#buttons, #screen-areas").removeClass("hidden");
            $("#screen").removeClass("clickable");
        }
    }
    if (deck_i != 0) {
        var symbol = correct[correct.length-1] == deck[deck_i-1] ? "〇" : "✕";
        $("#undo").text("Undo " + symbol + " " + deck[deck_i-1])[0].disabled = false;
    }
    else {
        $("#undo").text("Can't undo")[0].disabled = true;
    }
    if (deck_i < deck.length)
        $("#count").text((deck_i + 1) + "/" + deck.length);
    else
        $("#count").text(deck.length + "/" + deck.length);
}


///// Web Storage /////

function save_deck () {
    if (window.localStorage) {
        localStorage.setItem("kanji-flashcards.original_deck", original_deck);
        localStorage.setItem("kanji-flashcards.deck", deck);
        localStorage.setItem("kanji-flashcards.correct", correct);
        localStorage.setItem("kanji-flashcards.incorrect", incorrect);
         // Old version stuff
        localStorage.removeItem("kanji-flashcards.n_correct");
        localStorage.removeItem("kanji-flashcards.deck_size");
    }
}
function load_deck () {
    if (window.localStorage && window.localStorage.getItem("kanji-flashcards.original_deck")) {
         // Not bothering to validate the stored deck.
         // If the user messes with it, they get what they get.
        original_deck = window.localStorage.getItem("kanji-flashcards.original_deck");
        deck = window.localStorage.getItem("kanji-flashcards.deck");
        correct = window.localStorage.getItem("kanji-flashcards.correct");
        incorrect = window.localStorage.getItem("kanji-flashcards.incorrect");
         // Set up the deck builder how it was last time (more or less)
        var in_original_deck = {};
        for (var i = 0; i < original_deck.length; i++) {
            in_original_deck[original_deck[i]] = true;
        }
        var divs = $(".grade-select > div");
        for (var i = 0; i < divs.length; i++) {
            if (divs[i].textContent in in_original_deck)
                $(divs[i]).click();
        }
    }
    else {
        $("#use-grade-1").click();
        create_deck();
    }
}

function save_settings () {
    if (window.localStorage) {
        var front = "";
        if ($("#front-kanji")[0].checked) front += " kanji";
        if ($("#front-on-yomi")[0].checked) front += " on-yomi";
        if ($("#front-kun-yomi")[0].checked) front += " kun-yomi";
        if ($("#front-nanori")[0].checked) front += " nanori";
        if ($("#front-meanings")[0].checked) front += " meanings";
        localStorage.setItem("kanji-flashcards.show-front", front);
        var back = "";
        if ($("#back-kanji")[0].checked) back += " kanji";
        if ($("#back-on-yomi")[0].checked) back += " on-yomi";
        if ($("#back-kun-yomi")[0].checked) back += " kun-yomi";
        if ($("#back-nanori")[0].checked) back += " nanori";
        if ($("#back-meanings")[0].checked) back += " meanings";
        localStorage.setItem("kanji-flashcards.show-back", back);
        var theme = $("#theme-select").val();
        localStorage.setItem("kanji-flashcards.theme", theme);
        var font = $("#font-select").val();
        localStorage.setItem("kanji-flashcards.font", font);
        localStorage.removeItem("kanji-flashcards.actions");
    }
}
function load_settings () {
    if (window.localStorage) {
        var front = localStorage.getItem("kanji-flashcards.show-front");
        if (front) {
            $("#front-kanji")[0].checked = !!front.match(/\bkanji\b/);
            $("#front-on-yomi")[0].checked = !!front.match(/\bon-yomi\b/);
            $("#front-kun-yomi")[0].checked = !!front.match(/\bkun-yomi\b/);
            $("#front-nanori")[0].checked = !!front.match(/\bnanori\b/);
            $("#front-meanings")[0].checked = !!front.match(/\bmeanings\b/);
        }
        var back = localStorage.getItem("kanji-flashcards.show-back");
        if (back) {
            $("#back-kanji")[0].checked = !!back.match(/\bkanji\b/);
            $("#back-on-yomi")[0].checked = !!back.match(/\bon-yomi\b/);
            $("#back-kun-yomi")[0].checked = !!back.match(/\bkun-yomi\b/);
            $("#back-nanori")[0].checked = !!back.match(/\bnanori\b/);
            $("#back-meanings")[0].checked = !!back.match(/\bmeanings\b/);
        }
        var theme = localStorage.getItem("kanji-flashcards.theme");
        if (theme && valid_theme(theme)) {
            $("#theme-select").val(theme);
        }
        var font = localStorage.getItem("kanji-flashcards.font")
        if (font && valid_font(font)) {
            $("#font-select").val(font);
        }
    }
}


///// Style /////

function valid_theme (theme) {
    return theme.match(/^(?:paper|deepforest)$/);
}
function valid_font (font) {
    return font.match(/^(?:gothic|mincho)$/);
}

function update_style () {
    var theme = $("#theme-select").val();
    if (!valid_theme(theme))
        theme = "paper";
    var font = $("#font-select").val();
    if (!valid_font(font))
        font = "gothic";
    $("body").attr("class", "theme-" + theme + " font-" + font);
}


///// Init /////

$(document).ready(function(){
    load_settings();
    update_style();
    $("#status").text("Loading dictionary...");
    $.ajax({
        url: "kanjidic.1-6",
        mimeType: "text/plain; charset=UTF-8",
        dataType: "text",
        success: initialize,
        error: function (jqXHR, stat, mess) {
            $("#status").text("Failed to load dictionary: " + stat + "; " + mess);
        }
    });
});

function initialize (data) {
     // Load dictionary
    $("#status").text("Initializing dictionary...");
    var matches = data.match(/..*/g);
    for (var i = 0; i < matches.length; i++) {
        var line = matches[i];
        if (line[0] == '#') continue;
        var pre_names_m = line.match(/(?:(?! T1).)*/);
        var names_m = line.match(/ T[^{]*/);
        var grade_m = line.match(/\bG[0-9]+\b/);

        var onyomi = span_join(line.match(/-?[ァ-ヺ][.ァ-ヺ]*-?/g), "　");
        var kunyomi = pre_names_m[0].match(/-?[ぁ-ゖ][.ぁ-ゖ]*-?/g);
        if (kunyomi != null) {
            for (var j = 0; j < kunyomi.length; j++) {
                kunyomi[j] = kunyomi[j].replace(/\.(.*)$/, "<span class=\"okurigana\">$1</span>");
            }
        }
        kunyomi = span_join(kunyomi, "　");

        var nanori = names_m == null ? null : names_m[0].match(/-?[ぁ-ゖ][.ぁ-ゖ]*-?/g);
        nanori = span_join(nanori, "　");
        if (nanori != "") nanori = "（" + nanori + "）";

        var meanings = line.match(/\{[^}]+\}/g);
        if (meanings != null) {
            for (var j = 0; j < meanings.length; j++) {
                meanings[j] = meanings[j].slice(1, -1);
            }
        }
        meanings = span_join(meanings, ", ");

        dictionary[line[0]] = {
            kanji: line[0],
            grade: grade_m == null ? 0 : parseInt(grade_m[0].slice(1)),
            onyomi: onyomi,
            kunyomi: kunyomi,
            nanori: nanori,
            meanings: meanings,
        };
    }
    for (var k in hiragana) {
        dictionary[k] = {
            kanji: k,
            grade: -1,  // whataver, not actually used
            onyomi: "",
            kunyomi: "",
            nanori: "",
            meanings: hiragana[k],
        };
    }
    for (var k in katakana) {
        dictionary[k] = {
            kanji: k,
            grade: -2,
            onyomi: "",
            kunyomi: "",
            nanori: "",
            meanings: katakana[k],
        };
    }
     // Create deck builder
    var template = $("#grades").html();
    var builder = "";
     // hiragana
    var individual = "";
    var count = 0;
    for (var k in hiragana) {
        individual += "<div>" + k + "</div>";
        count += 1;
    }
    builder += template.replace(/Grade #/, "Hiragana").replace(/#/g, "hiragana").replace("0/0", "0/" + count).replace("仮", individual);
     // katakana
    var individual = "";
    var count = 0;
    for (var k in katakana) {
        individual += "<div>" + k + "</div>";
        count += 1;
    }
    builder += template.replace(/Grade #/, "Katakana").replace(/#/g, "katakana").replace("0/0", "0/" + count).replace("仮", individual);
     // grades
    for (var i = 1; i <= 6; i++) {
        var individual = "";
        var count = 0;
        for (var k in dictionary) {
            if (dictionary[k].grade == i) {
                individual += "<div>" + k + "</div>";
                count += 1;
            }
        }
        builder += template.replace(/#/g, i).replace("0/0", "0/" + count).replace("仮", individual);
    }
    $("#grades").html(builder);
    $(".grade-select > div").click(function (event) {
        var self = event.currentTarget;
        var parent = self.parentNode;
        if (self.className == "use") {
            self.className = "";
        }
        else {
            self.className = "use";
        }
        var grade = parent.id.match(/^grade-(.*)-select$/)[1];
        var num = 0;
        var den = 0;
        for (var i = 0; i < parent.childNodes.length; i++) {
            den += 1;
            if (parent.childNodes[i].className == "use") {
                num += 1;
            }
        }
        $("#grade-" + grade + "-count").text(num + "/" + den);
        $("#use-grade-" + grade)[0].checked = (num > 0);
    });
    $(".use-grade").change(function (event) {
        var self = event.currentTarget;
        var grade = self.id.match(/^use-grade-(.*)$/)[1];
        var individuals = $("#grade-" + grade + "-select > div");
        if (self.checked) {
            $("#grade-" + grade + "-count").text(individuals.length + "/" + individuals.length);
            individuals.attr("class", "use");
        }
        else {
            $("#grade-" + grade + "-count").text("0/" + individuals.length);
            individuals.attr("class", "");
        }
    });
    $("#new")[0].disabled = false;
     // Set up event handlers
    $("#yes").click(yes);
    $("#no").click(no);
     // Click anywhere except #control to flip
    $("#screen").click(function(event){ if (!flipped) flip(); });
    $("#control").click(function(event){ event.stopPropagation(); });
     // Wire up everything in the settings
    $("#deck-builder").click(function(event){ event.stopPropagation(); });
    $("#new").click(start_deck_builder);
    $("#undo").click(undo);
    $("#continue").click(continue_);
    $("#start-over").click(start_over);
    $("#finished-new").click(start_deck_builder);
    $("#settings-show input").change(function(){ save_settings(); update_display(); });
    $("#settings-style select").change(function(){ save_settings(); update_style(); });
    $("#deck-create").click(function(){
        stop_deck_builder();
        create_deck();
    });
    $("#deck-cancel").click(stop_deck_builder);
    $("#import").click(import_deck);
    $("#export").click(export_deck);
    $("#status").text("Everything's ready.").addClass("hidden");
    $(document).keydown(function(e){
        if (e.which == 13 || e.which == 32) {
            flip();
        }
        else if (e.which == 67 || e.which == 89 || e.which == 79) {
            yes();
        }
        else if (e.which == 69 || e.which == 78 || e.which == 88) {
            no();
        }
    });
    load_deck();
    draw();
}


///// Utilities /////

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function span_join (list, sep) {
    if (list == null) return "";
    else return "<span>" + list.join("</span>" + sep + "<span>") + "</span>";
}

///// Not worth putting in a separate file /////

var hiragana = {"あ":"a","い":"i","う":"u","え":"e","お":"o","か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko","さ":"sa","し":"si","す":"su","せ":"se","そ":"so","た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to","な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no","は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho","ま":"ma","み":"mi","む":"mu","め":"me","も":"mo","や":"ya","ゆ":"yu","よ":"yo","ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro","わ":"wa","を":"wo","ん":"n",};
var katakana = {"ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko","サ":"sa","シ":"si","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to","ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho","マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo","ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n"};


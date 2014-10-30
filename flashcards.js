
'use strict';

///// State /////

var dictionary = [];

var deck = [];  // deck[0] is displayed as the current card
var flipped = false;
var n_correct = 0;
var deck_size = 0;

 // For undo purposes
var old_deck = null;  // Just copy the entire darn thing
var undo_yes = true;

var flip_count = 0;
var answer_count = 0;

var deck_builder = false;

///// Actions /////

function create () {
    old_deck = null;
    deck = [];
     // Search deck builder for all selected kanji
    var selected = $(".grade-select > div.use");
    for (var i = 0; i < selected.length; i++) {
        for (var j = 0; j < dictionary.length; j++) {
            if (dictionary[j].kanji == selected[i].textContent) {
                deck.push(dictionary[j]);
            }
        }
    }
    deck = shuffle(deck);
    n_correct = 0;
    deck_size = deck.length;
    save_deck();
    draw();
}

function start_deck_builder () {
    deck_builder = true;
    $("#card").addClass("hidden");
    $("#deck-builder").removeClass("hidden");
    $("#control-hider")[0].checked = false;
    update_display();
}
function stop_deck_builder () {
    deck_builder = false;
    $("#deck-builder").addClass("hidden");
    $("#card").removeClass("hidden");
    update_display();
}

function draw () {
    if (deck_builder) return;
    flipped = false;
    update_display();
}

function flip () {
    if (deck_builder) return;
    flipped = true;
    flip_count += 1;
    update_display();
}

function process_card (action) {
    if (deck_builder) return;
    answer_count += 1;
    old_deck = deck.concat();
    if (action == "10") {
        deck.splice(10, 0, deck.shift());
    }
    else if (action == "random") {
        deck.splice(5 + Math.floor(Math.random() * (deck.length - 5)), 0, deck.shift());
    }
    else if (action == "back") {
        deck.push(deck.shift());
    }
    else if (action == "remove") {
        deck.shift();
    }
    save_deck();
}

function undo () {
    if (deck_builder) return;
    if (old_deck == null) return;
    if (undo_yes) n_correct -= 1;
    deck = old_deck;
    old_deck = null;
    save_deck();
    flip();
}

function yes () {
    if (deck_builder) return;
    if (!flipped) return true;
    n_correct += 1;
    undo_yes = true;
    process_card($("#on-yes").val());
    draw();
    return false;  // Prevent click from cascading to flip()
}
function no () {
    if (deck_builder) return;
    if (!flipped) return true;
    undo_yes = false;
    process_card($("#on-no").val());
    draw();
    return false;
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
     // Update card
    if (deck.length == 0) {
        $("#status").text("よく出来た！").removeClass("hidden");
        $("#kanji, .card-field, #everything").text("");
        current = "";
        $("#buttons, #screen-areas").addClass("hidden");
        $("#screen").removeClass("clickable");
    }
    else {
        if (deck[0].kanji != current) {
            current = deck[0].kanji;
            $("#kanji").text(deck[0].kanji);
            $("#on-yomi").html(deck[0].onyomi);
            $("#kun-yomi").html(deck[0].kunyomi);
            $("#nanori").html(deck[0].nanori);
            $("#meanings").html(deck[0].meanings);
            $("#everything").text(deck[0].everything);
        }
        if (flip_count == 0) {
            $("#status").text("Make a guess and click anywhere to check the answer.").removeClass("hidden");
        }
        else if (answer_count == 0) {
            $("#status").text("Was your guess correct?").removeClass("hidden");
        }
        else {
            $("#status").text("").addClass("hidden");
        }
         // Select which fields are visible
        if (deck_builder) {
            $("#buttons, #screen-areas").addClass("hidden");
            $("#screen").removeClass("clickable");
        }
        else if (!flipped) {  // front
            show_if_checked("#kanji", "#front-kanji");
            show_if_checked("#on-yomi", "#front-on-yomi");
            show_if_checked("#kun-yomi", "#front-kun-yomi");
            show_if_checked("#nanori", "#front-nanori");
            show_if_checked("#meanings", "#front-meanings");
            show_if_checked("#everything", "#front-everything");
            $("#buttons, #screen-areas").addClass("hidden");
            $("#screen").addClass("clickable");
        }
        else {  // back
            show_if_checked("#kanji", "#back-kanji");
            show_if_checked("#on-yomi", "#back-on-yomi");
            show_if_checked("#kun-yomi", "#back-kun-yomi");
            show_if_checked("#nanori", "#back-nanori");
            show_if_checked("#meanings", "#back-meanings");
            show_if_checked("#everything", "#back-everything");
            $("#buttons, #screen-areas").removeClass("hidden");
            $("#screen").removeClass("clickable");
        }
    }
    if (old_deck != null) {
        var symbol = undo_yes ? "〇" : "✕";
        $("#undo").text("Undo " + symbol + " " + old_deck[0].kanji)[0].disabled = false;
    }
    else {
        $("#undo").text("Can't undo")[0].disabled = true;
    }
    $("#count").text(n_correct + "/" + deck_size);
}


///// Web Storage /////

function save_deck () {
    if (window.localStorage) {
        var deck_s;
        for (var i = 0; i < deck.length; i++) {
            deck_s += deck[i].kanji;
        }
        localStorage.setItem("kanji-flashcards.deck", deck_s);
        localStorage.setItem("kanji-flashcards.n_correct", n_correct);
        localStorage.setItem("kanji-flashcards.deck_size", deck_size);
    }
}
function load_deck () {
    if (window.localStorage) {
        var deck_s = localStorage.getItem("kanji-flashcards.deck");
        for (var i = 0; i < deck_s.length; i++) {
             // This could be made more time-efficient.
            for (var j = 0; j < dictionary.length; j++) {
                if (dictionary[j].kanji == deck_s[i]) {
                    deck.push(dictionary[j]);
                }
            }
        }
        n_correct = parseInt(localStorage.getItem("kanji-flashcards.n_correct"));
        deck_size = parseInt(localStorage.getItem("kanji-flashcards.deck_size"));
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
        if ($("#front-everything")[0].checked) front += " everything";
        localStorage.setItem("kanji-flashcards.show-front", front);
        var back = "";
        if ($("#back-kanji")[0].checked) back += " kanji";
        if ($("#back-on-yomi")[0].checked) back += " on-yomi";
        if ($("#back-kun-yomi")[0].checked) back += " kun-yomi";
        if ($("#back-nanori")[0].checked) back += " nanori";
        if ($("#back-meanings")[0].checked) back += " meanings";
        if ($("#back-everything")[0].checked) back += " everything";
        localStorage.setItem("kanji-flashcards.show-back", back);
        var theme = $("#theme-select").val();
        localStorage.setItem("kanji-flashcards.theme", theme);
        var font = $("#font-select").val();
        localStorage.setItem("kanji-flashcards.font", font);
        var actions = $("#on-no").val() + " " + $("#on-yes").val();
        localStorage.setItem("kanji-flashcards.actions", actions);
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
            $("#front-everything")[0].checked = !!front.match(/\beverything\b/);
        }
        var back = localStorage.getItem("kanji-flashcards.show-back");
        if (back) {
            $("#back-kanji")[0].checked = !!back.match(/\bkanji\b/);
            $("#back-on-yomi")[0].checked = !!back.match(/\bon-yomi\b/);
            $("#back-kun-yomi")[0].checked = !!back.match(/\bkun-yomi\b/);
            $("#back-nanori")[0].checked = !!back.match(/\bnanori\b/);
            $("#back-meanings")[0].checked = !!back.match(/\bmeanings\b/);
            $("#back-everything")[0].checked = !!back.match(/\beverything\b/);
        }
        var theme = localStorage.getItem("kanji-flashcards.theme");
        if (theme && valid_theme(theme)) {
            $("#theme-select").val(theme);
        }
        var font = localStorage.getItem("kanji-flashcards.font")
        if (font && valid_font(font)) {
            $("#font-select").val(font);
        }
        var actions = localStorage.getItem("kanji-flashcards.actions");
        if (actions) {
            var match = actions.match(/^(10|random|back) (random|back|remove)$/);
            if (match[1]) $("#on-no").val(match[1]);
            if (match[2]) $("#on-yes").val(match[2]);
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
        var unicode_m = line.match(/\bU[0-9a-f]+\b/);

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

        dictionary.push({
            kanji: line[0],
            grade: grade_m == null ? 0 : parseInt(grade_m[0].slice(1)),
            unicode: unicode_m[0].slice(1),
            onyomi: onyomi,
            kunyomi: kunyomi,
            nanori: nanori,
            meanings: meanings,
            everything: line
        });
    }
    for (var k in hiragana) {
        dictionary.push({
            kanji: k,
            grade: -1,  // whataver, not actually used
            unicode: "",  // Do we even use this anywhere?
            onyomi: "",
            kunyomi: "",
            nanori: "",
            meanings: hiragana[k],
            everything: ""
        });
    }
    for (var k in katakana) {
        dictionary.push({
            kanji: k,
            grade: -2,
            unicode: "",
            onyomi: "",
            kunyomi: "",
            nanori: "",
            meanings: katakana[k],
            everything: ""
        });
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
        for (var j = 0; j < dictionary.length; j++) {
            if (dictionary[j].grade == i) {
                individual += "<div>" + dictionary[j].kanji + "</div>";
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
    $(".use-grade > input").change(function (event) {
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
    $("#use-grade-1").click();
    $("#new")[0].disabled = false;
     // Register event handlers
    $("#no").click(no);
    $("#yes").click(yes);
     // Click anywhere except #control to flip
    $("#screen").click(function(event){ if (!flipped) flip(); });
    $("#control").click(function(event){ event.stopPropagation(); });
    $("#deck-builder").click(function(event){ event.stopPropagation(); });
    $("#new").click(start_deck_builder);
    $("#undo").click(undo);
    $("#settings-show input").change(function(){ save_settings(); update_display(); });
    $("#settings-style select").change(function(){ save_settings(); update_style(); });
    $("#settings-actions select").change(save_settings);
    $("#deck-cancel").click(stop_deck_builder);
    $("#deck-create").click(function(){
        create();
        stop_deck_builder();
    });
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
    if (window.localStorage && localStorage.getItem("kanji-flashcards.deck")) {
        load_deck();
        draw();
    }
    else {
        reset();
    }
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


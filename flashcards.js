
var dic = [];
var cards = [];
var current = null;
var front = false;
var n_correct = 0;
var deck_size = 0;

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function initialize (data) {
    $("#status").text("Initializing dictionary...");
    var matches = data.match(/..*/g);
    for (var i = 0; i < matches.length; i++) {
        var line = matches[i];
        if (line[0] == '#') continue;
        var pre_names_m = line.match(/(?:(?! T1).)*/);
        var names_m = line.match(/ T[^{]*/);
        var grade_m = line.match(/\bG[0-9]+\b/);
        var unicode_m = line.match(/\bU[0-9a-f]+\b/);
        var onyomi_m = line.match(/-?[ァ-ヺ][.ァ-ヺ]*-?/g);
        var kunyomi_m = pre_names_m[0].match(/-?[ぁ-ゖ][.ぁ-ゖ]*-?/g);
        var kunyomi = kunyomi_m == null ? [] : kunyomi_m;
        for (var j = 0; j < kunyomi.length; j++) {
            kunyomi[j] = kunyomi[j].replace(/\.(.*)$/, "<span class=\"okurigana\">$1</span>");
        }
        var nanori_m = names_m == null ? [] : names_m[0].match(/-?[ぁ-ゖ][.ぁ-ゖ]*-?/g);
        var meanings_m = line.match(/\{[^}]+\}/g);
        var meanings = [];
        for (var j = 0; j < meanings_m.length; j++) {
            meanings.push(meanings_m[j].slice(1, -1));
        }
        dic.push({
            kanji: line[0],
            grade: grade_m == null ? 0 : parseInt(grade_m[0].slice(1)),
            unicode: unicode_m[0].slice(1),
            onyomi: onyomi_m == null ? [] : onyomi_m,
            kunyomi: kunyomi,
            nanori: nanori_m,
            meanings: meanings,
            everything: line
        });
    }
    $("#no").click(no);
    $("#yes").click(yes);
    $("#reset").click(reset);
    $("#screen").click(flip_card);
    $("#control").click(function(event){ event.stopPropagation(); });
    $("#settings-show input").change(change_show);
    $("#settings-style select").change(update_style);
    $("#settings-actions select").change(update_actions);
    $("#status").text("Everything's ready.");
    $("#status").addClass("hidden");
    $(document).keydown(function(e){
        if (e.which == 13 || e.which == 32) {
            flip_card();
        }
        else if (e.which == 67 || e.which == 89 || e.which == 79) {
            yes();
        }
        else if (e.which == 69 || e.which == 78 || e.which == 88) {
            no();
        }
    });
    var deck_s;
    if (window.localStorage && (deck_s = localStorage.getItem("kanji-flashcards.deck"))) {
        for (var i = 0; i < deck_s.length; i++) {
             // This could be made more time-efficient.
            for (var j = 0; j < dic.length; j++) {
                if (dic[j].kanji == deck_s[i]) {
                    cards.push(dic[j]);
                }
            }
        }
        n_correct = parseInt(localStorage.getItem("kanji-flashcards.n_correct"));
        deck_size = cards.length;
        front = false;
        draw_card();
    }
    else {
        reset();
    }
}

function reset () {
    cards = [];
    var use_grades = [];
    for (var i = 1; i < 7; i++) {
        use_grades[i] = ($("#G" + i + ":checked").length > 0);
    }
    for (var i = 0; i < dic.length; i++) {
        if (use_grades[dic[i].grade]) {
            cards.push(dic[i]);
        }
    }
    cards = shuffle(cards);
    n_correct = 0;
    deck_size = cards.length;
    front = false;
    draw_card();
}

function show_if_checked (elem, check) {
    if ($(check)[0].checked) {
        $(elem).removeClass("hidden");
    }
    else {
        $(elem).addClass("hidden");
    }
}

function change_show () {
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
    }
    update_display();
}
function update_display () {
    if (front) {
        show_if_checked("#kanji", "#front-kanji");
        show_if_checked("#on-yomi", "#front-on-yomi");
        show_if_checked("#kun-yomi", "#front-kun-yomi");
        show_if_checked("#nanori", "#front-nanori");
        show_if_checked("#meanings", "#front-meanings");
        show_if_checked("#everything", "#front-everything");
        $("#buttons").addClass("hidden");
        $("#screen").addClass("clickable");
    }
    else {
        show_if_checked("#kanji", "#back-kanji");
        show_if_checked("#on-yomi", "#back-on-yomi");
        show_if_checked("#kun-yomi", "#back-kun-yomi");
        show_if_checked("#nanori", "#back-nanori");
        show_if_checked("#meanings", "#back-meanings");
        show_if_checked("#everything", "#back-everything");
        $("#buttons").removeClass("hidden");
        $("#screen").removeClass("clickable");
    }
    $("#count").text(n_correct + "/" + deck_size);
}

function draw_card () {
    if (front) return;
    front = true;
    if (window.localStorage) {
        var deck_s;
        for (var i = 0; i < cards.length; i++) {
            deck_s += cards[i].kanji;
        }
        localStorage.setItem("kanji-flashcards.deck", deck_s);
        localStorage.setItem("kanji-flashcards.n_correct", n_correct);
    }
    update_display();
    if (cards.length == 0) {
        $("#status").text("よく出来た！");
        $("#status").removeClass("hidden");
        $("#kanji, .card-field, #everything").text("");
        return;
    }
    current = cards.shift();
    $("#kanji").text(current.kanji);
    $("#on-yomi").text(current.onyomi.join("　"));
    $("#kun-yomi").html(current.kunyomi.join("　"));
    if (current.nanori.length > 0) {
        $("#nanori").text("（" + current.nanori.join("　") + "）");
    }
    else {
        $("#nanori").text("");
    }
    $("#meanings").text(current.meanings.join(", "));
    $("#everything").text(current.everything);
    $("#status").text("");
}

function flip_card () {
    if (!front) return;
    front = false;
    update_display();
}

function process_card (action) {
    if (action == "10") {
        cards.splice(10, 0, current);
    }
    else if (action == "random") {
        cards.splice(5 + Math.floor(Math.random() * (cards.length - 5)), 0, current);
    }
    else if (action == "back") {
        cards.push(current);
    }
    else if (action == "remove") {
         // Silently forget current card
    }
}

function yes () {
    n_correct += 1;
    process_card($("#on-yes").val());
    draw_card();
    return false;
}
function no () {
    process_card($("#on-no").val());
    draw_card();
    return false;
}

function update_actions () {
    if (window.localStorage) {
        var actions = $("#on-no").val() + " " + $("#on-yes").val();
        localStorage.setItem("kanji-flashcards.actions", actions);
    }
}

function valid_theme (theme) {
    return theme.match(/^(?:paper|deepforest)$/);
}
function valid_font (font) {
    return font.match(/^(?:gothic|mincho)$/);
}

function update_style () {
    var theme = $("#theme-select").val();
    if (!valid_theme(theme))
        theme = "white";
    var font = $("#font-select").val();
    if (!valid_font(font))
        font = "gothic";
    $("body").attr("class", "theme-" + theme + " font-" + font);
    if (window.localStorage) {
        localStorage.setItem("kanji-flashcards.theme", theme);
        localStorage.setItem("kanji-flashcards.font", font);
    }
}

$(document).ready(function(){
    if (window.localStorage) {
        var theme = localStorage.getItem("kanji-flashcards.theme");
        if (theme && valid_theme(theme)) {
            $("#theme-select").val(theme);
        }
        var font = localStorage.getItem("kanji-flashcards.font")
        if (font && valid_font(font)) {
            $("#font-select").val(font);
        }
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
        var actions = localStorage.getItem("kanji-flashcards.actions");
        if (actions) {
            var match = actions.match(/^(10|random|back) (random|back|remove)$/);
            if (match[1]) $("#on-no").val(match[1]);
            if (match[2]) $("#on-yes").val(match[2]);
        }
    }
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


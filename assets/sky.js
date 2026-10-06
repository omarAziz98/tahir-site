// Tints the sky to the visitor's local time of day, like the app's Sky Clock.
// The app pins its sky to real prayer times; here a typical day is close enough.
(function () {
  var keys = [
    [0, 0x141833], [270, 0x141833],          // night
    [330, 0x3B4A7D], [375, 0x6E6A9A],        // Fajr, first light
    [420, 0xE7A27E], [510, 0x9CCDEB],        // sunrise, morning
    [810, 0x9CCDEB], [930, 0xF3B56E],        // Dhuhr, Asr
    [1035, 0xEE9A5E], [1110, 0xE0714F],      // late afternoon, Maghrib
    [1155, 0x5B3A63], [1200, 0x1A1F3D],      // dusk, Isha
    [1260, 0x141833], [1440, 0x141833]
  ];

  function rgb(hex) { return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]; }
  function mix(a, b, f) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * f); }); }
  function css(c) { return "rgb(" + c.join(",") + ")"; }
  function lum(c) {
    var l = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  var now = new Date();
  var m = now.getHours() * 60 + now.getMinutes();
  var sky = rgb(keys[0][1]);
  for (var i = 0; i < keys.length - 1; i++) {
    if (m >= keys[i][0] && m <= keys[i + 1][0]) {
      var span = keys[i + 1][0] - keys[i][0];
      sky = mix(rgb(keys[i][1]), rgb(keys[i + 1][1]), span ? (m - keys[i][0]) / span : 0);
      break;
    }
  }

  var dark = [22, 18, 14], light = [246, 242, 234];
  var darkInk = contrast(sky, dark) >= contrast(sky, light);
  var night = m < 330 || m >= 1200;
  var root = document.documentElement;
  root.style.setProperty("--sky", css(sky));
  root.style.setProperty("--ground", css(mix(sky, [0, 0, 0], 0.45)));
  root.style.setProperty("--ink", css(darkInk ? dark : light));
  root.style.setProperty("--ink-soft", darkInk ? "rgba(22,18,14,0.78)" : "#D5D8EA");
  root.classList.toggle("is-night", night);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", css(sky));

  document.addEventListener("DOMContentLoaded", function () {
    // Sun along an arc from sunrise to sunset; the moon sits high at night.
    var sun = document.getElementById("sun");
    var moon = document.getElementById("moon");
    if (sun && moon) {
      if (night) {
        sun.hidden = true;
        moon.removeAttribute("hidden");  // an <svg>, so no .hidden property
      } else {
        var t = Math.min(1, Math.max(0, (m - 400) / (1110 - 400)));
        sun.style.left = (8 + 84 * t) + "%";
        sun.style.top = (62 - 50 * Math.sin(Math.PI * t)) + "%";
      }
    }
    // Live date and time, as on the app's header.
    var stamp = document.getElementById("stamp");
    if (stamp) {
      var d = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
      var t2 = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      stamp.textContent = d + " · " + t2;
    }
  });
})();

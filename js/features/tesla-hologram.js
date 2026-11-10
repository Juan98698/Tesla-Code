// Original vector artwork. The head and pupils are separate layers; no model or textures are loaded.
export function teslaHologram() {
  return `<div class="tesla-hologram" data-tesla-hologram>
    <div class="tesla-beam"></div>
    <svg class="tesla-torso" viewBox="0 0 240 180" fill="none" focusable="false">
      <defs>
        <linearGradient id="tesla-jacket" x1="36" y1="28" x2="196" y2="170" gradientUnits="userSpaceOnUse"><stop stop-color="#24536a"/><stop offset=".5" stop-color="#102e43"/><stop offset="1" stop-color="#071725" stop-opacity=".25"/></linearGradient>
        <linearGradient id="tesla-collar" x1="105" y1="16" x2="137" y2="110" gradientUnits="userSpaceOnUse"><stop stop-color="#b8ecf4"/><stop offset="1" stop-color="#3d7c94" stop-opacity=".4"/></linearGradient>
        <linearGradient id="tesla-bust-fade" x2="0%" y2="100%"><stop offset=".65" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>
        <mask id="tesla-bust-mask"><rect width="240" height="180" fill="url(#tesla-bust-fade)"/></mask>
      </defs>
      <g mask="url(#tesla-bust-mask)" stroke="#77ccdf" stroke-width="1">
        <path d="M96 10 143 10 148 36 192 59Q214 68 222 105L231 176H9L18 105Q26 68 48 59L92 36Z" fill="url(#tesla-jacket)"/>
        <path d="M99 9H140L146 37 120 112 93 37Z" fill="#103245"/>
        <path d="M96 26 119 44 105 86 82 44ZM143 26 120 44 135 86 157 44Z" fill="url(#tesla-collar)"/>
        <path d="m119 46-7 12 8 48 10-48-9-12Z" fill="#092134"/>
        <path d="m82 43-22 22 18 12-12 14 50 75M157 43l22 22-18 12 12 14-50 75"/>
        <path d="m48 62 10 99M192 62l-10 99M31 117l39 12M169 129l39-12M118 109v59" opacity=".45"/>
        <path d="M22 147H218M18 156H222M15 165H225" opacity=".15"/>
        <path d="M43 100h8v8h17M197 100h-8v8h-17" stroke="#a3edec" opacity=".65"/>
        <circle cx="69" cy="108" r="2" fill="#9ef4ee"/><circle cx="171" cy="108" r="2" fill="#9ef4ee"/>
      </g>
    </svg>
    <div class="tesla-head" data-tesla-head>
      <svg viewBox="0 0 200 260" fill="none" focusable="false">
        <defs>
          <linearGradient id="tesla-skin" x1="58" y1="112" x2="157" y2="139" gradientUnits="userSpaceOnUse"><stop stop-color="#275d78"/><stop offset=".43" stop-color="#68b2c5"/><stop offset=".57" stop-color="#3d819f"/><stop offset="1" stop-color="#102b43"/></linearGradient>
          <linearGradient id="tesla-hair" x1="69" y1="31" x2="144" y2="104" gradientUnits="userSpaceOnUse"><stop stop-color="#255570"/><stop offset=".5" stop-color="#0a2137"/><stop offset="1" stop-color="#040f1e"/></linearGradient>
          <linearGradient id="tesla-neck" x1="84" y1="192" x2="130" y2="243" gradientUnits="userSpaceOnUse"><stop stop-color="#418398"/><stop offset="1" stop-color="#102b40"/></linearGradient>
          <pattern id="tesla-scan" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1.5H4" stroke="#b5f5ff" stroke-opacity=".16" stroke-width=".5"/></pattern>
          <clipPath id="tesla-eye-left"><path d="M68 132Q79 125 94 132Q83 141 70 136Z"/></clipPath>
          <clipPath id="tesla-eye-right"><path d="M116 132Q128 125 141 132Q130 140 118 136Z"/></clipPath>
        </defs>
        <path d="m83 192-1 42 22 17 31-23-8-39Z" fill="url(#tesla-neck)" stroke="#76bbce" stroke-width="1"/>
        <path d="m88 211 16 21 24-23" stroke="#8bd4de" stroke-opacity=".5"/>
        <path d="M61 118Q48 110 51 141L58 162 66 166M149 117Q163 112 159 141L150 161 143 163" fill="#1c4963" stroke="#79b4c9"/>
        <path d="m56 129 5 17M155 127l-6 20" stroke="#a5dbe4" stroke-opacity=".6"/>
        <path d="M65 80Q95 58 130 70L149 98 153 139 147 173 131 202 108 220 86 208 69 185 60 150Z" fill="url(#tesla-skin)" stroke="#8ddde6" stroke-width="1.2"/>
        <path d="m65 107 19-17 18 27-7 37-20 17-12-26Z" fill="#96dee0" fill-opacity=".14"/>
        <path d="m135 98-18 19 5 37 19 18 8-30Z" fill="#03182e" fill-opacity=".3"/>
        <path d="M64 114 81 109 95 119M116 119l14-10 17 7M70 148l13 13-9 17M139 149l-12 13 10 17M83 202l22 11 23-17" stroke="#a5f2ed" stroke-opacity=".25" stroke-width=".8"/>
        <path d="M58 111Q42 91 47 73Q51 54 67 47Q89 22 117 32Q134 31 147 46Q167 55 160 86L151 116 143 102Q146 84 132 74Q108 92 66 86L64 113Z" fill="url(#tesla-hair)" stroke="#79c2d8" stroke-width="1.2"/>
        <g stroke="#75c7df" stroke-width="1.1" stroke-linecap="round" opacity=".55">
          <path d="M59 72Q81 68 97 48T129 44M54 80Q82 81 104 61T140 51M63 58Q80 54 91 43M64 83Q96 85 120 62Q128 56 141 57M72 76Q93 74 110 57M143 65Q155 80 147 98M148 56Q162 65 155 84"/>
        </g>
        <path d="M67 123Q80 115 95 123L93 128Q81 123 69 128ZM114 122Q129 116 143 124L140 128Q129 123 116 127Z" fill="#09243a"/>
        <path d="M68 132Q79 125 94 132Q83 141 70 136ZM116 132Q128 125 141 132Q130 140 118 136Z" fill="#061c2d" stroke="#9bdbe5" stroke-width=".7"/>
        <g clip-path="url(#tesla-eye-left)"><g class="tesla-eye" data-tesla-eye="left"><ellipse cx="82" cy="133" rx="4" ry="5" fill="#6ed7ed"/><ellipse cx="82" cy="133" rx="1.8" ry="3.5" fill="#071725"/><circle cx="83" cy="131" r="1.1" fill="#e3ffff"/></g></g>
        <g clip-path="url(#tesla-eye-right)"><g class="tesla-eye" data-tesla-eye="right"><ellipse cx="129" cy="133" rx="4" ry="5" fill="#6ed7ed"/><ellipse cx="129" cy="133" rx="1.8" ry="3.5" fill="#071725"/><circle cx="130" cy="131" r="1.1" fill="#e3ffff"/></g></g>
        <path d="m104 127-5 28-7 13 11 6 13-7" fill="#254b66" stroke="#b0e9ec" stroke-width=".9"/>
        <path d="m105 136 4 23 8 7-7 5" stroke="#133c57" stroke-width="2"/>
        <path d="M83 182Q95 176 104 181Q114 176 126 182L135 191Q117 188 105 186Q92 189 77 190Z" fill="#071d30" stroke="#4486a3" stroke-width=".6"/>
        <path d="M90 196Q105 191 119 195M97 201l11 1" stroke="#12334b" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M75 174 80 184M135 174l-4 12M73 146Q80 150 91 146M118 146q11 4 21-1" stroke="#123c57" stroke-opacity=".65"/>
        <path d="M65 80Q95 58 130 70L149 98 153 139 147 173 131 202 108 220 86 208 69 185 60 150Z" fill="url(#tesla-scan)"/>
        <path d="M62 99v15M61 174l9 17M143 183l-8 15" stroke="#b2fbfa" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="tesla-projector"><i></i><i></i><span></span></div>
  </div>`;
}

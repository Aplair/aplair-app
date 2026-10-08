/* The 3D view: renderer, lights, and all view parts. Reads the game state every frame; never changes it. */
(function (TBS) {
  'use strict';

  class View {
    constructor(game, canvas, overlayRoot) {
      const cfg = game.cfg;
      this.game = game; this.canvas = canvas;
      this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
      this.renderer.setClearColor(cfg.COLORS.space, 1);
      this.renderer.shadowMap.enabled = !!cfg.SHADOWS;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.scene = new THREE.Scene();
      this.scene.add(new THREE.HemisphereLight(0xeef3ff, 0x6a6080, 0.82));
      this.sun = new THREE.DirectionalLight(0xffffff, 0.72);
      this.sun.castShadow = !!cfg.SHADOWS;
      const sc = this.sun.shadow.camera;
      sc.left = -15; sc.right = 15; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 60;
      this.sun.shadow.mapSize.set(cfg.SHADOW_MAP_SIZE, cfg.SHADOW_MAP_SIZE);
      this.sun.shadow.bias = -0.0008;
      this.scene.add(this.sun, this.sun.target);
      this.cam = new TBS.CameraRig(this);
      this.camera = this.cam.cam;
      this.fx = new TBS.FxView(this);
      this.world = new TBS.World(this);
      this.chars = new TBS.CharactersView(this);
      this.items = new TBS.ItemsView(this);
      this.circles = new TBS.CirclesView(this);
      this.overlay = new TBS.OverlayView(this, overlayRoot);
      this.occl = new TBS.Occlusion(this);
      this.width = 1; this.height = 1;
      this.resize();
    }

    resize() {
      const w = Math.max(1, this.canvas.clientWidth), h = Math.max(1, this.canvas.clientHeight);
      this.width = w; this.height = h;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.game.cfg.MAX_PIXEL_RATIO));
      this.renderer.setSize(w, h, false);
      this.cam.resize(w, h);
    }

    onEvent(e) {
      this.world.onEvent(e); this.chars.onEvent(e); this.items.onEvent(e);
      this.circles.onEvent(e); this.fx.onEvent(e); this.overlay.onEvent(e);
    }

    update(dt) {
      this.world.update(dt);
      this.chars.update(dt);
      this.items.update(dt);
      this.circles.update(dt);
      this.fx.update(dt);
      this.cam.update(dt);
      this.occl.update(dt);
      const t = this.cam.target, sx = Math.round(t.x * 4) / 4, sz = Math.round(t.z * 4) / 4;
      this.sun.position.set(sx - 9, 18, sz + 7);
      this.sun.target.position.set(sx, 0, sz);
      this.overlay.update(dt);
    }

    render() { this.renderer.render(this.scene, this.camera); }
  }

  TBS.View = View;
})(window.TBS = window.TBS || {});

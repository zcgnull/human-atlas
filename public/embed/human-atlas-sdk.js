/* Human Atlas host SDK.
 *
 * Lets a host page control an embedded Human Atlas viewer (an <iframe> whose
 * src includes ?embed=1&allowOrigin=<this page's origin>). Include it with a
 * plain script tag from the viewer's origin; it defines window.HumanAtlas.
 *
 *   var frame = document.getElementById('atlas');
 *   frame.src = HumanAtlas.embedUrl('https://viewer.example/', location.origin);
 *   var atlas = HumanAtlas.connect(frame, {origin: 'https://viewer.example/'});
 *   atlas.ready.then(function () { return atlas.call('atlas_focus', {id: 'heart', mode: 'isolate'}); });
 *   atlas.on('state', function (snapshot) { console.log(snapshot.scene.visible); });
 *
 * Protocol: every message carries {v: 1, channel: 'atlas'} and one of:
 *   request  {type: 'request',  id, tool, args}            host -> viewer
 *   response {type: 'response', id, ok, result | error}    viewer -> host
 *   event    {type: 'event', event: 'ready'|'state', payload} viewer -> host
 */
(function (global) {
  'use strict';
  var PROTOCOL_VERSION = 1;
  var CHANNEL = 'atlas';
  var DEFAULT_TIMEOUT = 15000;

  function embedUrl(viewerUrl, hostOrigin) {
    var url = new URL(viewerUrl, global.location.href);
    url.searchParams.set('embed', '1');
    url.searchParams.set('allowOrigin', hostOrigin || global.location.origin);
    return url.toString();
  }

  function connect(iframe, options) {
    options = options || {};
    // targetOrigin for messages posted into the iframe: the viewer's origin,
    // normalized (user-supplied URLs may carry a trailing slash or path).
    var viewerOrigin = new URL(options.origin || iframe.src, global.location.href).origin;
    var timeout = options.timeout === undefined ? DEFAULT_TIMEOUT : options.timeout;
    var nextId = 1;
    var pending = Object.create(null);
    var listeners = Object.create(null);
    var readyPromise = null;

    function handler(event) {
      if (!iframe.contentWindow || event.source !== iframe.contentWindow) return;
      if (viewerOrigin !== '*' && event.origin !== viewerOrigin) return;
      var message = event.data;
      if (!message || typeof message !== 'object' || message.v !== PROTOCOL_VERSION || message.channel !== CHANNEL) return;
      if (message.type === 'response') {
        var entry = pending[message.id];
        if (!entry) return;
        delete pending[message.id];
        clearTimeout(entry.timer);
        if (message.ok) entry.resolve(message.result);
        else entry.reject(new Error(message.error || 'The atlas tool call failed.'));
      } else if (message.type === 'event') {
        (listeners[message.event] || []).slice().forEach(function (callback) {
          try { callback(message.payload); } catch (error) { setTimeout(function () { throw error; }, 0); }
        });
      }
    }
    global.addEventListener('message', handler);

    function call(tool, args) {
      return new Promise(function (resolve, reject) {
        if (!iframe.contentWindow) { reject(new Error('The atlas iframe is not available.')); return; }
        var id = 'c' + nextId++;
        var timer = timeout > 0 ? setTimeout(function () {
          delete pending[id];
          reject(new Error("The atlas tool '" + tool + "' timed out."));
        }, timeout) : 0;
        pending[id] = {resolve: resolve, reject: reject, timer: timer};
        iframe.contentWindow.postMessage({v: PROTOCOL_VERSION, channel: CHANNEL, type: 'request', id: id, tool: tool, args: args || {}}, viewerOrigin);
      });
    }

    function on(event, callback) {
      (listeners[event] = listeners[event] || []).push(callback);
      return function off() {
        var list = listeners[event] || [];
        var index = list.indexOf(callback);
        if (index >= 0) list.splice(index, 1);
      };
    }

    readyPromise = new Promise(function (resolve) {
      on('ready', resolve);
    });

    return {
      call: call,
      on: on,
      close: function close() {
        global.removeEventListener('message', handler);
        Object.keys(pending).forEach(function (id) {
          clearTimeout(pending[id].timer);
          pending[id].reject(new Error('The atlas connection was closed.'));
          delete pending[id];
        });
      },
      get ready() { return readyPromise; }
    };
  }

  /** Parse [[structure_id]] pins out of agent prose: `{refs, text}` where refs is
   *  [{id, index}] in order of first appearance and text has the markers stripped
   *  (with the space before them). Pass isKnown(id) to drop ids the model
   *  invented — an unknown id should cost the reader a link, not leave brackets
   *  mid-sentence. Render each ref as a numbered pin; clicking one usually calls
   *  atlas.call('atlas_focus', {id: ref.id, mode: 'frame'}). */
  function parsePins(text, isKnown) {
    var pattern = /\[\[([a-z0-9_:\-]+)\]\]/gi, seen = {}, refs = [], match;
    while ((match = pattern.exec(String(text)))) {
      var id = match[1];
      if (seen[id] || (isKnown && !isKnown(id))) continue;
      seen[id] = true;
      refs.push({ id: id, index: refs.length + 1 });
    }
    return { refs: refs, text: String(text).replace(/[ \t]?\[\[[a-z0-9_:\-]+\]\]/gi, '') };
  }

  global.HumanAtlas = {connect: connect, embedUrl: embedUrl, parsePins: parsePins, PROTOCOL_VERSION: PROTOCOL_VERSION, CHANNEL: CHANNEL};
})(typeof window !== 'undefined' ? window : this);

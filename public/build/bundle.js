
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*
     * @description 实现通过鼠标来移动（拖拽）指定元素
     * @browser-support IE7+
     * @version 1.0
     */
    let moveElementConfig = function(window, doc) {
    	var zIndex = 666,	//移动元素的【z-index】值
    		screenAvailHeight = function(doc) {	//获取当前浏览器下屏幕的可用高度
    			try{
    				var div = doc.createElement("div");
    				div.style.height = "100vh";
    				doc.body.appendChild(div);
    				var screenAvailHeight = div.clientHeight;
    				doc.body.removeChild(div);
    				div = null;
    				return screenAvailHeight;
    			}catch(e){	//IE9以下
    				return doc.body.clientHeight;
    			}
    		}(doc);
    	
    	var funcs = {	//一些基本功能
    		addEventListener : function(dom, type, func) {	//添加监听事件
    			if (dom.addEventListener) {
    				dom.addEventListener(type, func, false);
    			} else if(dom.attachEvent) {
    				dom.attachEvent("on" + type, func);
    			} else {
    				dom["on" + type] = func;
    			}
    			return this;
    		},
    		removeEventListener : function(dom, type, func) {	//移除监听事件
    			if (dom.removeEventListener) {
    				dom.removeEventListener(type, func, false);
    			} else if(dom.detachEvent) {
    				dom.detachEvent("on" + type, func);
    			} else {
    				dom["on" + type] = null;
    			}
    			return this;
    		},
    		preventDefault : function(e) {	//阻止点击事件的默认行为
    			if (e.preventDefault) {
    				e.preventDefault();
    			} else {
    				e.returnValue = false;
    			}
    			return this;
    		}
    	};
    	
    	var moveElement = function(doc, screenAvailHeight, funcs) {		//核心功能
    		var add = function(mouseMoveEle, mouseDownEle) {
    			/*
    			 * @description	为指定元素添加移动功能
    			 * @parameter {object} mouseMoveEle 可移动的对象
    			 * @parameter {object} [mouseDownEle] 鼠标点击并按住的对象
    			 * @return {function} mouseDown 为该点击元素（即上面的[mouseDownEle]）绑定的函数，可用于配合下面的【remove】方法移除此元素的【mousedown】事件
    			 */
    			
    			if (typeof mouseMoveEle !== "object") {
    				throw new Error("mouseMoveEle must be a object!");
    			}
    			if (mouseDownEle && typeof mouseDownEle !== "object") {
    				throw new Error("mouseDownEle must be a object!");
    			} else if(!mouseDownEle) {
    				mouseDownEle = mouseMoveEle;
    			}
    			
    			//保证一些样式（如果已设置，可删除）
    			mouseDownEle.style.cursor = "move";
    			mouseMoveEle.style.position = "fixed";
    			mouseMoveEle.style.zIndex = zIndex++;
    			
    			var	maxLeft = doc.body.clientWidth - mouseMoveEle.clientWidth,
    				maxTop = screenAvailHeight - mouseMoveEle.clientHeight;
    			
    			var mouseDown = function(event) {	//鼠标按下
    				let e = event || window.event;
    				funcs.preventDefault(e);
    				
    				var moveEle = mouseMoveEle,
    					leftAvail = e.clientX - moveEle.offsetLeft,
    					topAvail = e.clientY - moveEle.offsetTop;
    					
    				var mouseMove = function(event) {	//鼠标移动
    					e = event || window.event;
    					var left = e.clientX - leftAvail,
    						top = e.clientY - topAvail;
    					
    					//实时设置移动元素的位置，并控制在当前浏览器窗口可用范围内（IE9以下除外）。为了兼容IE7、IE8，下面只能用【moveEle】，而不能直接使用【this】。
    					moveEle.style.left = left > 0 ? (left > maxLeft ? (maxLeft + "px") : (left + "px")) : 0;
    					moveEle.style.top = top > 0 ? (top > maxTop ? (maxTop + "px") : (top + "px")) : 0;
    					return false;
    				};
    				
    				//添加鼠标移动事件
    				funcs.addEventListener(doc, "mousemove", mouseMove);
    				
    				//鼠标抬起后移除鼠标移动事件
    				funcs.addEventListener(doc, "mouseup", function() {
    					funcs.removeEventListener(doc, "mousemove", mouseMove);
    				});
    			};
    			
    			//添加鼠标点击事件
    			funcs.addEventListener(mouseDownEle, "mousedown", mouseDown);
    			
    			return mouseDown;
    		};
    		var remove = function(mouseDownEle, func) {
    			/*
    			 * @description	移除点击元素的【mousedown】功能
    			 * @parameter {object} mouseDownEle 鼠标点击并按住的对象
    			 * @parameter {function} [func] 使用【add】方法所接收到的函数
    			 * @return {object} this 【moveElement】对象
    			 */
    			if (typeof mouseDownEle !== "object") {
    				throw new Error("mouseDownEle must be a object!");
    			}
    			if (typeof func !== "function") {
    				throw new Error("func must be a function!");
    			}
    			
    			funcs.removeEventListener(mouseDownEle, "mousedown", func);
    			mouseDownEle.style.cursor = "default";
    			
    			return this;
    		};
    		
    		return {
    			add : add,
    			remove : remove
    		}
    	}(doc, screenAvailHeight, funcs);
    	
    	window.moveElement = moveElement;
    	
    };
    //(window, document);

    /* src/PuzzlePiece.svelte generated by Svelte v3.38.3 */
    const file$1 = "src/PuzzlePiece.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (76:4) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			set_style(div, "width", /*config*/ ctx[0].cellWidth + "px");
    			set_style(div, "height", /*config*/ ctx[0].cellWidth + "px");
    			set_style(div, "float", "left");
    			add_location(div, file$1, 76, 5, 1820);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*config*/ 1) {
    				set_style(div, "width", /*config*/ ctx[0].cellWidth + "px");
    			}

    			if (dirty & /*config*/ 1) {
    				set_style(div, "height", /*config*/ ctx[0].cellWidth + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(76:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:4) {#if isSolid(row,row2)}
    function create_if_block(ctx) {
    	let div;
    	let div_id_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", div_id_value = /*config*/ ctx[0].pieceId + "_" + /*row*/ ctx[9] + "_" + /*row2*/ ctx[12]);
    			set_style(div, "background", /*config*/ ctx[0].pieceColor);
    			set_style(div, "width", /*config*/ ctx[0].cellWidth + "px");
    			set_style(div, "height", /*config*/ ctx[0].cellWidth + "px");
    			set_style(div, "float", "left");
    			add_location(div, file$1, 74, 5, 1638);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*config*/ 1 && div_id_value !== (div_id_value = /*config*/ ctx[0].pieceId + "_" + /*row*/ ctx[9] + "_" + /*row2*/ ctx[12])) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (dirty & /*config*/ 1) {
    				set_style(div, "background", /*config*/ ctx[0].pieceColor);
    			}

    			if (dirty & /*config*/ 1) {
    				set_style(div, "width", /*config*/ ctx[0].cellWidth + "px");
    			}

    			if (dirty & /*config*/ 1) {
    				set_style(div, "height", /*config*/ ctx[0].cellWidth + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(74:4) {#if isSolid(row,row2)}",
    		ctx
    	});

    	return block;
    }

    // (73:3) {#each Array(config.width) as _,row2}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*isSolid*/ ctx[3](/*row*/ ctx[9], /*row2*/ ctx[12])) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(73:3) {#each Array(config.width) as _,row2}",
    		ctx
    	});

    	return block;
    }

    // (71:1) {#each Array(config.length) as __,row}
    function create_each_block$1(ctx) {
    	let div;
    	let t;
    	let each_value_1 = Array(/*config*/ ctx[0].width);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(div, file$1, 71, 2, 1558);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*config, isSolid*/ 9) {
    				each_value_1 = Array(/*config*/ ctx[0].width);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(71:1) {#each Array(config.length) as __,row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let div_id_value;
    	let mounted;
    	let dispose;
    	let each_value = Array(/*config*/ ctx[0].length);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "shape");
    			attr_dev(div, "id", div_id_value = /*config*/ ctx[0].pieceId);
    			set_style(div, "left", /*config*/ ctx[0].left);
    			set_style(div, "top", /*config*/ ctx[0].top);
    			set_style(div, "width", /*config*/ ctx[0].width * /*config*/ ctx[0].cellWidth + "px");
    			set_style(div, "height", /*config*/ ctx[0].length * /*config*/ ctx[0].cellWidth + "px");
    			set_style(div, "transform", "rotate(" + /*angle*/ ctx[1] + "deg)");
    			add_location(div, file$1, 69, 0, 1297);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Array, config, isSolid*/ 9) {
    				each_value = Array(/*config*/ ctx[0].length);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*config*/ 1 && div_id_value !== (div_id_value = /*config*/ ctx[0].pieceId)) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (dirty & /*config*/ 1) {
    				set_style(div, "left", /*config*/ ctx[0].left);
    			}

    			if (dirty & /*config*/ 1) {
    				set_style(div, "top", /*config*/ ctx[0].top);
    			}

    			if (dirty & /*config*/ 1) {
    				set_style(div, "width", /*config*/ ctx[0].width * /*config*/ ctx[0].cellWidth + "px");
    			}

    			if (dirty & /*config*/ 1) {
    				set_style(div, "height", /*config*/ ctx[0].length * /*config*/ ctx[0].cellWidth + "px");
    			}

    			if (dirty & /*angle*/ 2) {
    				set_style(div, "transform", "rotate(" + /*angle*/ ctx[1] + "deg)");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PuzzlePiece", slots, []);

    	let { config = {
    		pieceId,
    		pieceColor,
    		length,
    		width,
    		cellWidth,
    		solidCells: []
    	} } = $$props;

    	let angle = 0;
    	let isDrag = false;
    	let isMouseDown = false;

    	onMount(() => {
    		moveElementConfig(window, document);
    		let ele = document.getElementById(config.pieceId);
    		makeEleMoveable();

    		ele.addEventListener("mousemove", function (e) {
    			if (isMouseDown) {
    				isDrag = true;
    			}
    		});

    		ele.addEventListener("mousedown", function (e) {
    			isMouseDown = true;
    		});

    		ele.addEventListener("mouseup", function (e) {
    			isMouseDown = false;

    			setTimeout(
    				() => {
    					isDrag = false;
    				},
    				200
    			);
    		});
    	});

    	function makeEleMoveable() {
    		let ele = document.getElementById(config.pieceId);

    		for (let cell of config.solidCells) {
    			let id = `${config.pieceId}_${cell[0]}_${cell[1]}`;
    			let moveEle = document.getElementById(id);
    			moveElement.add(ele, moveEle);
    		}
    	}

    	function click(event) {
    		if (isDrag) {
    			return;
    		}

    		$$invalidate(1, angle = angle + 90);

    		if (angle >= 360) {
    			$$invalidate(1, angle = angle - 360);
    		}

    		isDrag = false;
    	}

    	function isSolid(i, j) {
    		for (let p of config.solidCells) {
    			if (p[0] == i && p[1] == j) {
    				return true;
    			}
    		}

    		return false;
    	}

    	const writable_props = ["config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PuzzlePiece> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		each,
    		moveElementConfig,
    		config,
    		angle,
    		isDrag,
    		isMouseDown,
    		makeEleMoveable,
    		click,
    		isSolid
    	});

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    		if ("angle" in $$props) $$invalidate(1, angle = $$props.angle);
    		if ("isDrag" in $$props) isDrag = $$props.isDrag;
    		if ("isMouseDown" in $$props) isMouseDown = $$props.isMouseDown;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [config, angle, click, isSolid];
    }

    class PuzzlePiece extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { config: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PuzzlePiece",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get config() {
    		throw new Error("<PuzzlePiece>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<PuzzlePiece>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let pieceConfig = {
        pieceId: 'qqq',
        pieceColor: 'red',
        length: 4,
        width: 2,
        cellWidth: 54,
        solidCells: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1]],
        left:'300px',
        top:'167px',
    };

    let pieceConfig2 = {
        pieceId: '222',
        pieceColor: 'green',
        length: 3,
        width: 3,
        cellWidth: 54,
        solidCells: [[0, 2], [1, 0], [1, 1], [1, 2], [2, 0]],
        left:'985px',
        top:'160px',
    };

    let pieceConfig3 = {
        pieceId: '333',
        pieceColor: 'aquamarine',
        length: 3,
        width: 3,
        cellWidth: 54,
        left:'981px',
        top:'344px',
        solidCells: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]]
    };

    let pieceConfig4 = {
        pieceId: '444',
        pieceColor: 'purple',
        length: 2,
        width: 3,
        cellWidth: 54,
        left:'290px',
        top:'400px',
        solidCells: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]]
    };

    let pieceConfig5 = {
        pieceId: '555',
        pieceColor: 'pink',
        length: 2,
        width: 4,
        cellWidth: 54,
        left:'1087px',
        top:'390px',
        solidCells: [[0, 3], [1, 0], [1, 1], [1, 2], [1, 3]]
    };

    let pieceConfig6 = {
        pieceId: '666',
        pieceColor: 'chocolate',
        length: 3,
        width: 2,
        cellWidth: 54,
        left:'1215px',
        top:'182px',
        solidCells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]]
    };

    let pieceConfig7 = {
        pieceId: '777',
        pieceColor: 'crimson',
        length: 2,
        width: 3,
        cellWidth: 54,
        left:'90px',
        top:'391px',
        solidCells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]
    };

    let pieceConfig8 = {
        pieceId: '888',
        pieceColor: 'blue',
        length: 4,
        width: 2,
        cellWidth: 54,
        left:'123px',
        top:'123px',
        solidCells: [[0, 0], [1, 0], [1, 1], [2, 0], [3, 0]]
    };

    let configs = [
        pieceConfig,pieceConfig2,pieceConfig3,pieceConfig4,
        pieceConfig5,pieceConfig6,pieceConfig7,pieceConfig8
    ];

    // 获取元素的绝对位置坐标（像对于页面左上角）
    let getPosition = function (element) {
        //计算x坐标
        var actualLeft = element.offsetLeft;
        var current = element.offsetParent;
        while (current !== null) {
            actualLeft += current.offsetLeft;
            current = current.offsetParent;
        }
        //计算y坐标
        var actualTop = element.offsetTop;
        var current = element.offsetParent;
        while (current !== null) {
            actualTop += (current.offsetTop + current.clientTop);
            current = current.offsetParent;
        }
        //返回结果
        return { x: actualLeft, y: actualTop }
    };

    /* src/App.svelte generated by Svelte v3.38.3 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (212:1) {#each configs as c}
    function create_each_block(ctx) {
    	let puzzlepiece;
    	let current;

    	puzzlepiece = new PuzzlePiece({
    			props: { config: /*c*/ ctx[9] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(puzzlepiece.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(puzzlepiece, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(puzzlepiece.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(puzzlepiece.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(puzzlepiece, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(212:1) {#each configs as c}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let div;
    	let table;
    	let tr0;
    	let td0;
    	let t3;
    	let td1;
    	let t5;
    	let td2;
    	let t7;
    	let td3;
    	let t9;
    	let td4;
    	let t11;
    	let td5;
    	let t13;
    	let tr1;
    	let td6;
    	let t15;
    	let td7;
    	let t17;
    	let td8;
    	let t19;
    	let td9;
    	let t21;
    	let td10;
    	let t23;
    	let td11;
    	let t25;
    	let tr2;
    	let td12;
    	let t27;
    	let td13;
    	let t29;
    	let td14;
    	let t31;
    	let td15;
    	let t33;
    	let td16;
    	let t35;
    	let td17;
    	let t37;
    	let td18;
    	let t39;
    	let tr3;
    	let td19;
    	let t41;
    	let td20;
    	let t43;
    	let td21;
    	let t45;
    	let td22;
    	let t47;
    	let td23;
    	let t49;
    	let td24;
    	let t51;
    	let td25;
    	let t53;
    	let tr4;
    	let td26;
    	let t55;
    	let td27;
    	let t57;
    	let td28;
    	let t59;
    	let td29;
    	let t61;
    	let td30;
    	let t63;
    	let td31;
    	let t65;
    	let td32;
    	let t67;
    	let tr5;
    	let td33;
    	let t69;
    	let td34;
    	let t71;
    	let td35;
    	let t73;
    	let td36;
    	let t75;
    	let td37;
    	let t77;
    	let td38;
    	let t79;
    	let td39;
    	let t81;
    	let tr6;
    	let td40;
    	let t83;
    	let td41;
    	let t85;
    	let td42;
    	let t87;
    	let current;
    	let each_value = configs;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			div = element("div");
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Jan";
    			t3 = space();
    			td1 = element("td");
    			td1.textContent = "Feb";
    			t5 = space();
    			td2 = element("td");
    			td2.textContent = "Mar";
    			t7 = space();
    			td3 = element("td");
    			td3.textContent = "Apr";
    			t9 = space();
    			td4 = element("td");
    			td4.textContent = "May";
    			t11 = space();
    			td5 = element("td");
    			td5.textContent = "Jun";
    			t13 = space();
    			tr1 = element("tr");
    			td6 = element("td");
    			td6.textContent = "Jul";
    			t15 = space();
    			td7 = element("td");
    			td7.textContent = "Aug";
    			t17 = space();
    			td8 = element("td");
    			td8.textContent = "Sep";
    			t19 = space();
    			td9 = element("td");
    			td9.textContent = "Oct";
    			t21 = space();
    			td10 = element("td");
    			td10.textContent = "Nov";
    			t23 = space();
    			td11 = element("td");
    			td11.textContent = "Dec";
    			t25 = space();
    			tr2 = element("tr");
    			td12 = element("td");
    			td12.textContent = "1";
    			t27 = space();
    			td13 = element("td");
    			td13.textContent = "2";
    			t29 = space();
    			td14 = element("td");
    			td14.textContent = "3";
    			t31 = space();
    			td15 = element("td");
    			td15.textContent = "4";
    			t33 = space();
    			td16 = element("td");
    			td16.textContent = "5";
    			t35 = space();
    			td17 = element("td");
    			td17.textContent = "6";
    			t37 = space();
    			td18 = element("td");
    			td18.textContent = "7";
    			t39 = space();
    			tr3 = element("tr");
    			td19 = element("td");
    			td19.textContent = "8";
    			t41 = space();
    			td20 = element("td");
    			td20.textContent = "9";
    			t43 = space();
    			td21 = element("td");
    			td21.textContent = "10";
    			t45 = space();
    			td22 = element("td");
    			td22.textContent = "11";
    			t47 = space();
    			td23 = element("td");
    			td23.textContent = "12";
    			t49 = space();
    			td24 = element("td");
    			td24.textContent = "13";
    			t51 = space();
    			td25 = element("td");
    			td25.textContent = "14";
    			t53 = space();
    			tr4 = element("tr");
    			td26 = element("td");
    			td26.textContent = "15";
    			t55 = space();
    			td27 = element("td");
    			td27.textContent = "16";
    			t57 = space();
    			td28 = element("td");
    			td28.textContent = "17";
    			t59 = space();
    			td29 = element("td");
    			td29.textContent = "18";
    			t61 = space();
    			td30 = element("td");
    			td30.textContent = "19";
    			t63 = space();
    			td31 = element("td");
    			td31.textContent = "20";
    			t65 = space();
    			td32 = element("td");
    			td32.textContent = "21";
    			t67 = space();
    			tr5 = element("tr");
    			td33 = element("td");
    			td33.textContent = "22";
    			t69 = space();
    			td34 = element("td");
    			td34.textContent = "23";
    			t71 = space();
    			td35 = element("td");
    			td35.textContent = "24";
    			t73 = space();
    			td36 = element("td");
    			td36.textContent = "25";
    			t75 = space();
    			td37 = element("td");
    			td37.textContent = "26";
    			t77 = space();
    			td38 = element("td");
    			td38.textContent = "27";
    			t79 = space();
    			td39 = element("td");
    			td39.textContent = "28";
    			t81 = space();
    			tr6 = element("tr");
    			td40 = element("td");
    			td40.textContent = "29";
    			t83 = space();
    			td41 = element("td");
    			td41.textContent = "30";
    			t85 = space();
    			td42 = element("td");
    			td42.textContent = "31";
    			t87 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-1p92mbg");
    			add_location(h1, file, 143, 1, 2983);
    			attr_dev(td0, "id", "jan");
    			attr_dev(td0, "class", "svelte-1p92mbg");
    			add_location(td0, file, 148, 4, 3128);
    			attr_dev(td1, "class", "svelte-1p92mbg");
    			add_location(td1, file, 149, 4, 3154);
    			attr_dev(td2, "class", "svelte-1p92mbg");
    			add_location(td2, file, 150, 4, 3171);
    			attr_dev(td3, "class", "svelte-1p92mbg");
    			add_location(td3, file, 151, 4, 3188);
    			attr_dev(td4, "class", "svelte-1p92mbg");
    			add_location(td4, file, 152, 4, 3205);
    			attr_dev(td5, "class", "svelte-1p92mbg");
    			add_location(td5, file, 153, 4, 3222);
    			add_location(tr0, file, 147, 3, 3119);
    			attr_dev(td6, "class", "svelte-1p92mbg");
    			add_location(td6, file, 157, 4, 3279);
    			attr_dev(td7, "class", "svelte-1p92mbg");
    			add_location(td7, file, 158, 4, 3296);
    			attr_dev(td8, "class", "svelte-1p92mbg");
    			add_location(td8, file, 159, 4, 3313);
    			attr_dev(td9, "class", "svelte-1p92mbg");
    			add_location(td9, file, 160, 4, 3330);
    			attr_dev(td10, "class", "svelte-1p92mbg");
    			add_location(td10, file, 161, 4, 3347);
    			attr_dev(td11, "class", "svelte-1p92mbg");
    			add_location(td11, file, 162, 4, 3364);
    			add_location(tr1, file, 156, 3, 3270);
    			attr_dev(td12, "class", "svelte-1p92mbg");
    			add_location(td12, file, 166, 4, 3421);
    			attr_dev(td13, "class", "svelte-1p92mbg");
    			add_location(td13, file, 167, 4, 3436);
    			attr_dev(td14, "class", "svelte-1p92mbg");
    			add_location(td14, file, 168, 4, 3451);
    			attr_dev(td15, "class", "svelte-1p92mbg");
    			add_location(td15, file, 169, 4, 3466);
    			attr_dev(td16, "class", "svelte-1p92mbg");
    			add_location(td16, file, 170, 4, 3481);
    			attr_dev(td17, "class", "svelte-1p92mbg");
    			add_location(td17, file, 171, 4, 3496);
    			attr_dev(td18, "class", "svelte-1p92mbg");
    			add_location(td18, file, 172, 4, 3511);
    			add_location(tr2, file, 165, 3, 3412);
    			attr_dev(td19, "class", "svelte-1p92mbg");
    			add_location(td19, file, 175, 4, 3543);
    			attr_dev(td20, "class", "svelte-1p92mbg");
    			add_location(td20, file, 176, 4, 3558);
    			attr_dev(td21, "class", "svelte-1p92mbg");
    			add_location(td21, file, 177, 4, 3573);
    			attr_dev(td22, "class", "svelte-1p92mbg");
    			add_location(td22, file, 178, 4, 3589);
    			attr_dev(td23, "class", "svelte-1p92mbg");
    			add_location(td23, file, 179, 4, 3605);
    			attr_dev(td24, "class", "svelte-1p92mbg");
    			add_location(td24, file, 180, 4, 3621);
    			attr_dev(td25, "class", "svelte-1p92mbg");
    			add_location(td25, file, 181, 4, 3637);
    			add_location(tr3, file, 174, 3, 3534);
    			attr_dev(td26, "class", "svelte-1p92mbg");
    			add_location(td26, file, 184, 4, 3670);
    			attr_dev(td27, "class", "svelte-1p92mbg");
    			add_location(td27, file, 185, 4, 3686);
    			attr_dev(td28, "class", "svelte-1p92mbg");
    			add_location(td28, file, 186, 4, 3702);
    			attr_dev(td29, "class", "svelte-1p92mbg");
    			add_location(td29, file, 187, 4, 3718);
    			attr_dev(td30, "class", "svelte-1p92mbg");
    			add_location(td30, file, 188, 4, 3734);
    			attr_dev(td31, "class", "svelte-1p92mbg");
    			add_location(td31, file, 189, 4, 3750);
    			attr_dev(td32, "class", "svelte-1p92mbg");
    			add_location(td32, file, 190, 4, 3766);
    			add_location(tr4, file, 183, 3, 3661);
    			attr_dev(td33, "class", "svelte-1p92mbg");
    			add_location(td33, file, 193, 4, 3799);
    			attr_dev(td34, "class", "svelte-1p92mbg");
    			add_location(td34, file, 194, 4, 3815);
    			attr_dev(td35, "class", "svelte-1p92mbg");
    			add_location(td35, file, 195, 4, 3831);
    			attr_dev(td36, "class", "svelte-1p92mbg");
    			add_location(td36, file, 196, 4, 3847);
    			attr_dev(td37, "class", "svelte-1p92mbg");
    			add_location(td37, file, 197, 4, 3863);
    			attr_dev(td38, "class", "svelte-1p92mbg");
    			add_location(td38, file, 198, 4, 3879);
    			attr_dev(td39, "class", "svelte-1p92mbg");
    			add_location(td39, file, 199, 4, 3895);
    			add_location(tr5, file, 192, 3, 3790);
    			attr_dev(td40, "class", "svelte-1p92mbg");
    			add_location(td40, file, 202, 4, 3928);
    			attr_dev(td41, "class", "svelte-1p92mbg");
    			add_location(td41, file, 203, 4, 3944);
    			attr_dev(td42, "class", "svelte-1p92mbg");
    			add_location(td42, file, 204, 4, 3960);
    			add_location(tr6, file, 201, 3, 3919);
    			attr_dev(table, "id", "puzzleTable");
    			attr_dev(table, "border", "1");
    			attr_dev(table, "cellspacing", "0");
    			set_style(table, "margin", "auto");
    			add_location(table, file, 146, 2, 3044);
    			attr_dev(div, "class", "mainDiv");
    			set_style(div, "width", "100%");
    			add_location(div, file, 145, 1, 3001);
    			attr_dev(main, "class", "svelte-1p92mbg");
    			add_location(main, file, 142, 0, 2975);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(div, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(tr0, t3);
    			append_dev(tr0, td1);
    			append_dev(tr0, t5);
    			append_dev(tr0, td2);
    			append_dev(tr0, t7);
    			append_dev(tr0, td3);
    			append_dev(tr0, t9);
    			append_dev(tr0, td4);
    			append_dev(tr0, t11);
    			append_dev(tr0, td5);
    			append_dev(table, t13);
    			append_dev(table, tr1);
    			append_dev(tr1, td6);
    			append_dev(tr1, t15);
    			append_dev(tr1, td7);
    			append_dev(tr1, t17);
    			append_dev(tr1, td8);
    			append_dev(tr1, t19);
    			append_dev(tr1, td9);
    			append_dev(tr1, t21);
    			append_dev(tr1, td10);
    			append_dev(tr1, t23);
    			append_dev(tr1, td11);
    			append_dev(table, t25);
    			append_dev(table, tr2);
    			append_dev(tr2, td12);
    			append_dev(tr2, t27);
    			append_dev(tr2, td13);
    			append_dev(tr2, t29);
    			append_dev(tr2, td14);
    			append_dev(tr2, t31);
    			append_dev(tr2, td15);
    			append_dev(tr2, t33);
    			append_dev(tr2, td16);
    			append_dev(tr2, t35);
    			append_dev(tr2, td17);
    			append_dev(tr2, t37);
    			append_dev(tr2, td18);
    			append_dev(table, t39);
    			append_dev(table, tr3);
    			append_dev(tr3, td19);
    			append_dev(tr3, t41);
    			append_dev(tr3, td20);
    			append_dev(tr3, t43);
    			append_dev(tr3, td21);
    			append_dev(tr3, t45);
    			append_dev(tr3, td22);
    			append_dev(tr3, t47);
    			append_dev(tr3, td23);
    			append_dev(tr3, t49);
    			append_dev(tr3, td24);
    			append_dev(tr3, t51);
    			append_dev(tr3, td25);
    			append_dev(table, t53);
    			append_dev(table, tr4);
    			append_dev(tr4, td26);
    			append_dev(tr4, t55);
    			append_dev(tr4, td27);
    			append_dev(tr4, t57);
    			append_dev(tr4, td28);
    			append_dev(tr4, t59);
    			append_dev(tr4, td29);
    			append_dev(tr4, t61);
    			append_dev(tr4, td30);
    			append_dev(tr4, t63);
    			append_dev(tr4, td31);
    			append_dev(tr4, t65);
    			append_dev(tr4, td32);
    			append_dev(table, t67);
    			append_dev(table, tr5);
    			append_dev(tr5, td33);
    			append_dev(tr5, t69);
    			append_dev(tr5, td34);
    			append_dev(tr5, t71);
    			append_dev(tr5, td35);
    			append_dev(tr5, t73);
    			append_dev(tr5, td36);
    			append_dev(tr5, t75);
    			append_dev(tr5, td37);
    			append_dev(tr5, t77);
    			append_dev(tr5, td38);
    			append_dev(tr5, t79);
    			append_dev(tr5, td39);
    			append_dev(table, t81);
    			append_dev(table, tr6);
    			append_dev(tr6, td40);
    			append_dev(tr6, t83);
    			append_dev(tr6, td41);
    			append_dev(tr6, t85);
    			append_dev(tr6, td42);
    			append_dev(main, t87);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);

    			if (dirty & /*configs*/ 0) {
    				each_value = configs;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function checkIsDone() {
    	
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;

    	// TODO 元素在旋转之后就不能自动吸附到网格上面了
    	// 遍历piece下面的所有颜色方格，检查位置，只要有一个(元素旋转之后获取的位置并不是实际元素的位置，需要做一次坐标的运算，但是我并不会算。。。。)
    	// TODO 检查是否已经完成拼图了
    	// 遍历所有piece的所有格子，检查每个格子和拼图中所有的div的位置是否重合，如果重合就判定为该位置已经备覆盖
    	// 如果计算出指定日期的所有的解
    	let cellHeight = 54;

    	let xBarriors = new Array();
    	let yBarriors = new Array();

    	onMount(() => {
    		initBarrior();
    		addAutoFixPosition();
    	});

    	function initBarrior() {
    		let ele = document.getElementById("jan");
    		let p = getPosition(ele);

    		for (let i = 0; i < 8; i++) {
    			xBarriors[i] = p.x + cellHeight * i;
    			yBarriors[i] = p.y + cellHeight * i;
    		}
    	} // console.log(xBarriors);
    	// console.log(yBarriors);

    	let minDistance = 20;

    	function addAutoFixPosition() {
    		for (let c of configs) {
    			let ele = document.getElementById(c.pieceId);

    			ele.addEventListener("mouseup", function (e) {
    				console.log(ele.style.left + "," + ele.style.top);
    				let rect = ele.getBoundingClientRect();
    				console.log(rect.left + "," + rect.right + "," + rect.top + "," + rect.bottom);

    				//debugger
    				let elePositon = getPosition(ele);

    				for (let solidCell of c.solidCells) {
    					let eleCell = document.getElementById(`${c.pieceId}_${solidCell[0]}_${solidCell[1]}`);
    					let position = getPosition(eleCell);

    					// console.log(position);
    					let diff = isCloseEnough(position);

    					if (diff != null) {
    						ele.style.left = elePositon.x + diff.x + "px";
    						ele.style.top = elePositon.y + diff.y + "px";
    						console.log("return");
    						return;
    					}
    				}
    			}); //adjustPosition(ele);
    		}
    	}

    	function adjustPosition(ele) {
    		let p = getPosition(ele);
    		let x = -1;
    		let y = -1;

    		for (let xBarrior of xBarriors) {
    			if (Math.abs(xBarrior - p.x) < minDistance) {
    				x = xBarrior;
    			}
    		}

    		for (let yBarrior of yBarriors) {
    			if (Math.abs(yBarrior - p.y) < minDistance) {
    				y = yBarrior;
    			}
    		}

    		if (x != -1 && y != -1) {
    			// console.log(x + "," + y);
    			ele.style.left = x + "px";

    			ele.style.top = y + "px";
    		}
    	}

    	function isCloseEnough(p) {
    		let x = -1;
    		let y = -1;

    		for (let xBarrior of xBarriors) {
    			if (Math.abs(xBarrior - p.x) < minDistance) {
    				x = xBarrior;
    			}
    		}

    		for (let yBarrior of yBarriors) {
    			if (Math.abs(yBarrior - p.y) < minDistance) {
    				y = yBarrior;
    			}
    		}

    		if (x != -1 && y != -1) {
    			return { x: x - p.x, y: y - p.y };
    		} else {
    			return null;
    		}
    	}

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		PuzzlePiece,
    		configs,
    		getPosition,
    		each,
    		name,
    		cellHeight,
    		xBarriors,
    		yBarriors,
    		initBarrior,
    		minDistance,
    		addAutoFixPosition,
    		adjustPosition,
    		isCloseEnough,
    		checkIsDone
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("cellHeight" in $$props) cellHeight = $$props.cellHeight;
    		if ("xBarriors" in $$props) xBarriors = $$props.xBarriors;
    		if ("yBarriors" in $$props) yBarriors = $$props.yBarriors;
    		if ("minDistance" in $$props) minDistance = $$props.minDistance;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'A puzzle a day!'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

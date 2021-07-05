<script>
    import { onMount } from "svelte";
    import {moveElementConfig} from "./moveElement"

	// export let pieceId;
	// export let pieceColor;

	export let pieceConfig = {
		pieceId,
		pieceColor,
	}

    let angle = 0;
	let isDrag = false;
	let isMouseDown = false;

	onMount(()=>{
		moveElementConfig(window,document);
		let ele = document.getElementById(pieceConfig.pieceId);
		moveElement.add(ele);
		ele.addEventListener('mousemove',function(e){
			if(isMouseDown){
				isDrag = true;
				// console.log('move');
			}
		});
		ele.addEventListener('mousedown',function(e){
			isMouseDown = true;
			// console.log('down');
		});
		ele.addEventListener('mouseup',function(e){
			isMouseDown = false;
			// console.log('up');
			setTimeout(()=>{
				isDrag = false;
			},200);
		});
    });

	function click(event){
		// console.log(isDrag);
		if(isDrag){
			return;
		}
		angle = angle + 90;
		if(angle >= 360){
			angle = angle - 360;
		}
		isDrag = false;
	}

</script>

<div id = {pieceConfig.pieceId} on:click={click} style="width:54px;height:108px;background:{pieceConfig.pieceColor};transform:rotate({angle}deg);">

</div>

<style>
	div {
		left: 300px;
		top:200px;
	}
</style>
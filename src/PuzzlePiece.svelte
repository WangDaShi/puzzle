<script>
    import { onMount } from "svelte";
	import { each } from "svelte/internal";
    import {moveElementConfig} from "./moveElement"

	export let config = {
		pieceId,
		pieceColor,
		length,
		width,
		cellWidth,
		solidCells:[]
	}

    let angle = 0;
	let isDrag = false;
	let isMouseDown = false;

	onMount(()=>{
		moveElementConfig(window,document);
		let ele = document.getElementById(config.pieceId);
		makeEleMoveable();
		ele.addEventListener('mousemove',function(e){
			if(isMouseDown){
				isDrag = true;
			}
		});
		ele.addEventListener('mousedown',function(e){
			isMouseDown = true;
		});
		ele.addEventListener('mouseup',function(e){
			isMouseDown = false;
			setTimeout(()=>{
				isDrag = false;
			},200);
		});
	});

	function makeEleMoveable(){
		let ele = document.getElementById(config.pieceId);
		for(let cell of config.solidCells){
			let id = `${config.pieceId}_${cell[0]}_${cell[1]}`;
			let moveEle = document.getElementById(id);
			moveElement.add(ele,moveEle);
		}
	}

	function click(event){
		if(isDrag){
			return;
		}
		angle = angle + 90;
		if(angle >= 360){
			angle = angle - 360;
		}
		isDrag = false;
	}

	function isSolid(i,j){
		for(let p of config.solidCells){
			if(p[0] == i && p[1] == j){
				return true;
			}
		}
		return false;
	}

</script>

<div class="shape" id = {config.pieceId} on:click={click} style="left:{config.left};top:{config.top};width:{config.width * config.cellWidth}px;height:{config.length * config.cellWidth}px;transform:rotate({angle}deg);">
	{#each Array(config.length) as __,row}
		<div>
			{#each Array(config.width) as _,row2}
				{#if isSolid(row,row2)}
					<div id = {config.pieceId + "_" + row + "_" + row2} style="background:{config.pieceColor};width:{config.cellWidth}px;height:{config.cellWidth}px;float:left;"></div>
				{:else}
					<div style="width:{config.cellWidth}px;height:{config.cellWidth}px;float:left;"></div>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style>

	/* .shape {
		left: 300px;
		top:200px;
	} */


</style>
<script>
    import { onMount } from "svelte";
import { each } from "svelte/internal";
    import {moveElementConfig} from "./moveElement"

	// export let pieceId;
	// export let pieceColor;

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

	function isSolid(i,j){
		// debugger
		console.log(i + "," + j);
		console.log('solidCells:' + config.solidCells);
		// for(let p of config.solidCells){
		// 	console.log(p);
		// }
		for(let p of config.solidCells){
			console.log('p:' + p)
			if(p[0] == i && p[1] == j){
				console.log('true')
				return true;
			}
		}
		return false;
	}

</script>

<div class="shape" id = {config.pieceId} on:click={click} style="width:{config.width * config.cellWidth}px;height:{config.length * config.cellWidth}px;transform:rotate({angle}deg);">
	{#each Array(config.length) as __,row}
		<div>
			{#each Array(config.width) as _,row2}
				{#if isSolid(row,row2)}
					<div style="background:{config.pieceColor};width:{config.cellWidth}px;height:{config.cellWidth}px;float:left;"></div>
				{:else}
					<div style="width:{config.cellWidth}px;height:{config.cellWidth}px;float:left;"></div>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style>
	.shape {
		left: 300px;
		top:200px;
	}


</style>
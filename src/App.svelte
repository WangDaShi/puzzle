<script>
	import { onMount } from "svelte";

	import PuzzlePiece from "./PuzzlePiece.svelte";
	import { configs } from "./pieceConfigs";
	import { getPosition } from "./tools";
	import { each } from "svelte/internal";

	export let name;

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
		// console.log(xBarriors);
		// console.log(yBarriors);
	}

	let minDistance = 20;

	function addAutoFixPosition() {
		for (let c of configs) {
			let ele = document.getElementById(c.pieceId);
			ele.addEventListener("mouseup", function (e) {
				console.log(ele.style.left + ',' + ele.style.top);
				let rect = .getBoundingClientRect();
				console.log(rect.left + ',' + rect.right + ',' + rect.top + ',' + rect.bottom)
				//debugger
				let elePositon = getPosition(ele);
				for(let solidCell of c.solidCells){
					let eleCell = document.getElementById(`${c.pieceId}_${solidCell[0]}_${solidCell[1]}`);
					
					let position = getPosition(eleCell);
					// console.log(position);
					let diff = isCloseEnough(position);
					if(diff != null){
						ele.style.left = (elePositon.x + diff.x) + "px";
						ele.style.top = (elePositon.y + diff.y) + "px";
						checkIsDone();
						console.log('return');
						return;
					}
				}
				//adjustPosition(ele);
			});
			
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
			checkIsDone();
		}
	}

	function isCloseEnough(p){
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
			return {x: x-p.x,y: y - p.y};
		}else{
			return null;
		}
	}

	function checkIsDone(){

	}
</script>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	td {
		height: 50px;
		width: 50px;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<main>
	<h1>{name}</h1>

	<div class="mainDiv" style="width:100%">
		<table id="puzzleTable" border="1" cellspacing="0" style="margin:auto">
			<tr>
				<td id="jan">Jan</td>
				<td>Feb</td>
				<td>Mar</td>
				<td>Apr</td>
				<td>May</td>
				<td>Jun</td>
				<!-- <td></td> -->
			</tr>
			<tr>
				<td>Jul</td>
				<td>Aug</td>
				<td>Sep</td>
				<td>Oct</td>
				<td>Nov</td>
				<td>Dec</td>
				<!-- <td></td> -->
			</tr>
			<tr>
				<td>1</td>
				<td>2</td>
				<td>3</td>
				<td>4</td>
				<td>5</td>
				<td>6</td>
				<td>7</td>
			</tr>
			<tr>
				<td>8</td>
				<td>9</td>
				<td>10</td>
				<td>11</td>
				<td>12</td>
				<td>13</td>
				<td>14</td>
			</tr>
			<tr>
				<td>15</td>
				<td>16</td>
				<td>17</td>
				<td>18</td>
				<td>19</td>
				<td>20</td>
				<td>21</td>
			</tr>
			<tr>
				<td>22</td>
				<td>23</td>
				<td>24</td>
				<td>25</td>
				<td>26</td>
				<td>27</td>
				<td>28</td>
			</tr>
			<tr>
				<td>29</td>
				<td>30</td>
				<td>31</td>
			</tr>
		</table>
	</div>

	<!-- <PuzzlePieces></PuzzlePieces> -->

	{#each configs as c}
		<PuzzlePiece config={c} />
	{/each}
</main>

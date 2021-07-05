<script>

	import PuzzlePiece from "./PuzzlePiece.svelte";

	export let name;

	let pieceConfig = {
		pieceId:'qqq',
		pieceColor:'red',
		length:4,
		width:2,
		cellWidth:54,
		solidCells:[[0,0],[1,0],[2,0],[2,1],[3,1]]
	}
	
	let pieceConfig2 = {
		pieceId:'222',
		pieceColor:'green',
		length:3,
		width:3,
		cellWidth:54,
		solidCells:[[0,2],[1,0],[1,1],[1,2],[2,0]]
	}

</script>

<main>
	<h1>{name}</h1>

	<div class="mainDiv" style="width:100%">

		<table border="1" cellspacing="0" style="width:396px;margin:auto">
			<tr>
				<td>Jan</td>
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

	<PuzzlePiece config={pieceConfig}></PuzzlePiece>
	<PuzzlePiece config={pieceConfig2}></PuzzlePiece>

</main>

<style>

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	table {
		height: 386px;
		width: 386px;
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
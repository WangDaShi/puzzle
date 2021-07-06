<script>
    import PuzzlePiece from "./PuzzlePiece.svelte";

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

	let pieceConfig3 = {
		pieceId:'333',
		pieceColor:'aquamarine',
		length:3,
		width:3,
		cellWidth:54,
		solidCells:[[0,0],[0,1],[0,2],[1,0],[2,0]]
	}

	let pieceConfig4 = {
		pieceId:'444',
		pieceColor:'purple',
		length:2,
		width:3,
		cellWidth:54,
		solidCells:[[0,0],[0,2],[1,0],[1,1],[1,2]]
	}

	let pieceConfig5 = {
		pieceId:'555',
		pieceColor:'pink',
		length:2,
		width:4,
		cellWidth:54,
		solidCells:[[0,3],[1,0],[1,1],[1,2],[1,3]]
	}

	let pieceConfig6 = {
		pieceId:'666',
		pieceColor:'chocolate',
		length:3,
		width:2,
		cellWidth:54,
		solidCells:[[0,0],[0,1],[1,0],[1,1],[2,0]]
	}

	let pieceConfig7 = {
		pieceId:'777',
		pieceColor:'crimson',
		length:2,
		width:3,
		cellWidth:54,
		solidCells:[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]]
	}

	let pieceConfig8 = {
		pieceId:'888',
		pieceColor:'blue',
		length:4,
		width:2,
		cellWidth:54,
		solidCells:[[0,0],[1,0],[1,1],[2,0],[3,0]]
	}

</script>

<PuzzlePiece config={pieceConfig}></PuzzlePiece>
<PuzzlePiece config={pieceConfig2}></PuzzlePiece>
<PuzzlePiece config={pieceConfig3}></PuzzlePiece>
<PuzzlePiece config={pieceConfig4}></PuzzlePiece>
<PuzzlePiece config={pieceConfig5}></PuzzlePiece>
<PuzzlePiece config={pieceConfig6}></PuzzlePiece>
<PuzzlePiece config={pieceConfig7}></PuzzlePiece>
<PuzzlePiece config={pieceConfig8}></PuzzlePiece>
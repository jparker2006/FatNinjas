<?php

if (isset($_POST['PullLobbyTable']))
    $goPull = $_POST['PullLobbyTable'];
else if (isset($_POST['AddToLobbyTable']))
    $jsonAdd = $_POST['AddToLobbyTable'];

if ($goPull)
    $sFeedback = PullLobbyTable($goPull);
else if ($jsonAdd)
    $sFeedback = AddToLobbyTable($jsonAdd);

echo $sFeedback;

function PullLobbyTable($goPull) {
    $sSQL = "SELECT * FROM Lobby ORDER BY id DESC";
    $tResult = QueryDB ($sSQL);
    $nRows = $tResult->num_rows;
    $objGames = [];
    if ($nRows > 0) {
        for ($x=0; $x < $nRows; $x++) {
            $row = $tResult->fetch_assoc();
            $objGames[$x] = new stdClass();
            $objGames[$x]->name = $row["gamename"];
            $objGames[$x]->id = $row["id"];
            $objGames[$x]->color = $row["color"];
            $objGames[$x]->lastused = $row["lastused"];
        }
    }
    return json_encode($objGames);
}

function AddToLobbyTable($jsonAdd) {
    $objGame = json_decode($jsonAdd);
    $dbhost = 'localhost';
    $dbuser = 'jakeParker';
    $dbpass = 'Yv9zEtKfr5yMPgkvWa4v9N';
    $db = "Hackathon";
    $dbconnect = new mysqli($dbhost, $dbuser, $dbpass, $db);
    $stmt = $dbconnect->prepare("INSERT INTO Lobby (gamename, color) VALUES (?,?)");
    $stmt->bind_param("ss", $objGame->name, $objGame->color);
    $bStatus = $stmt->execute();
    $stmt->close();
    return PullLobbyTable(0);
}

function QueryDB ($sSQL) {
    $dbhost = 'localhost';
    $dbuser = 'jakeParker';
    $dbpass = 'Yv9zEtKfr5yMPgkvWa4v9N';
    $db = "Hackathon";
    $dbconnect = new mysqli($dbhost, $dbuser, $dbpass, $db);
    $Result = $dbconnect->query($sSQL);
    $dbconnect->close();
    return $Result;
}



// CREATE TABLE Lobby (
// id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
// gamename VARCHAR(40) NOT NULL UNIQUE,
// color VARCHAR (20),
// lastused TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
// )

?>

<?php

$method = $_REQUEST['method'];
$deviceName = $_REQUEST['deviceName'];
$dataItemID = $_REQUEST['dataItemId'];

$timestamp = date(DATE_W3C);
$value = urlencode( $_REQUEST['value'] );

$pwd = $_REQUEST['pwd'];

//echo $method . '<br />';
//echo $deviceName. '<br />';
//echo $dataItemID . '<br />';
echo $value . '<br />';
//$time_ = microtime(true);

$put_url = 'http://localhost:82/' . $method . '?timestamp=' . $timestamp . '&deviceName=' . $deviceName . '&dataItemId=' . $dataItemID . '&value=' . $value;
echo $put_url;
//if($pwd == 'password here!'){
   $file = fopen ($put_url, "r");	
//}

if (!$file) {
    echo "<p>Unable to open remote file\n";
    exit;
}
while (!feof ($file)) {
    $line = fgets ($file, 1024);
    echo $line;
}
fclose($file);
?>


<?php

define('DEV_MODE', true);

//import pliku autoload.php z folderu utils
require($_SERVER['DOCUMENT_ROOT'].'/utils/autoload.php');
//od tego momentu $_SERVER['DOCUMENT_ROOT'] jest dostępny pod stałą ROOT

//inicjalizacja WK-Tamer
$app = new Tamer\App();
// $app->useEnvironmentVariables(!DEV_MODE);
$app->useTwig(DEV_MODE);

//definicja stałej TAMER_API_KEY zawierającej klucz API otrzymany w procesie instalacji. Bez klucza nie będzie możliwe aktualizowanie WK-Tamera
// define('TAMER_API_KEY', \Tamer\env('TAMER_API_KEY'));

/*******************
* ROUTING KLIENCKI *
********************/
$app->get("/", function($req, $res){
    return $res->render('index.twig');
});


/************************************
* FINALIZING APP - REQUEST LISTENER *
*************************************/
$app->run();

?>
<?php header("Content-Type: text/plain"); echo "PHP ".PHP_VERSION."
curl:".(function_exists("curl_init")?"yes":"no")."
writable:".(is_writable(__DIR__)?"yes":"no")."
";

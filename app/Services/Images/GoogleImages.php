<?php

namespace App\Services\Images;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleImages {

    private $images = [];

    public function getImages($query)
    {
        $config = [
            'key' => config('services.google_search.key'),
            'cx' => config('services.google_search.cx'),
            'gl' => 'md',
            'imgColorType' => 'color',
            'dateRestrict' => 'm[12]',
            'searchType' => 'image',
//        'sort' => 'date-sdate',
            'q' => trim($query),
        ];

//        $response = Http::get(config('services.google_search.url'),  $config)->json();
        $response = $this->testData();

        if (array_key_exists('error', $response)) {
            Log::error('GOOGLE_ERROR: ' . json_encode($response['error']));

            return [
                'error' => $response['error']['code'] === 429 ?
                    "Limita de interogări la Google depășită" :
                    'Ceva s-a intamplat si nu mai pot accesa Google'
            ];
        }

//        dd($response);
        foreach ($response['items'] as $image) {
            if ($image['displayLink'] === 'www.facebook.com' || $image['image']['width'] < $image['image']['height']) {
                continue;
            }
            array_push($this->images, [
                'url' => $image['link'],
                'article' => $image['image']['contextLink'],
                'site' => $image['displayLink'],
                'width' => $image['image']['width'],
                'height' => $image['image']['height'],
            ]);
        }

        return [
            'images' => $this->images,
            'next_page' => $response['queries']['nextPage'][0]
        ];
    }

    protected function testData()
    {
        return [
            "kind" => "customsearch#search",
            "url" => [
                "type" => "application/json",
                "template" => "https://www.googleapis.com/customsearch/v1?q={searchTerms}&num={count?}&start={startIndex?}&lr={language?}&safe={safe?}&cx={cx?}&sort={sort?}&filter={filter?}&gl={gl?}&cr={cr?}&googlehost={googleHost?}&c2coff={disableCnTwTranslation?}&hq={hq?}&hl={hl?}&siteSearch={siteSearch?}&siteSearchFilter={siteSearchFilter?}&exactTerms={exactTerms?}&excludeTerms={excludeTerms?}&linkSite={linkSite?}&orTerms={orTerms?}&relatedSite={relatedSite?}&dateRestrict={dateRestrict?}&lowRange={lowRange?}&highRange={highRange?}&searchType={searchType}&fileType={fileType?}&rights={rights?}&imgSize={imgSize?}&imgType={imgType?}&imgColorType={imgColorType?}&imgDominantColor={imgDominantColor?}&alt=json"
            ],
            "queries" => [
                "request" => [
                    0 => [
                        "title" => "Google Custom Search - GAZUL RUSESC, MAI SCUMP ÎN LUNA IULIE",
                        "totalResults" => "3670000",
                        "searchTerms" => "GAZUL RUSESC, MAI SCUMP ÎN LUNA IULIE",
                        "count" => 10,
                        "startIndex" => 1,
                        "inputEncoding" => "utf8",
                        "outputEncoding" => "utf8",
                        "safe" => "off",
                        "cx" => "3799fa5b7854847b0",
                        "gl" => "md",
                        "dateRestrict" => "m[12]",
                        "searchType" => "image",
                        "imgColorType" => "color",
                    ]
                ],
                "nextPage" => [
                    0 => [
                        "title" => "Google Custom Search - GAZUL RUSESC, MAI SCUMP ÎN LUNA IULIE",
                        "totalResults" => "3670000",
                        "searchTerms" => "GAZUL RUSESC, MAI SCUMP ÎN LUNA IULIE",
                        "count" => 10,
                        "startIndex" => 11,
                        "inputEncoding" => "utf8",
                        "outputEncoding" => "utf8",
                        "safe" => "off",
                        "cx" => "3799fa5b7854847b0",
                        "gl" => "md",
                        "dateRestrict" => "m[12]",
                        "searchType" => "image",
                        "imgColorType" => "color",
                    ]
                ]
            ],
            "context" => [
                "title" => "modelIMG"
            ],
            "searchInformation" => [
                "searchTime" => 0.390412,
                "formattedSearchTime" => "0.39",
                "totalResults" => "3670000",
                "formattedTotalResults" => "3,670,000",
            ],
            "items" => [
                0 => [
                    "kind" => "customsearch#result",
                    "title" => "Tot mai scump! Cât va achita Republica Moldova în luna iulie ...",
                    "htmlTitle" => "Tot <b>mai scump</b>! Cât va achita Republica Moldova în <b>luna iulie</b> ...",
                    "link" => "https://706172616e74657a65.ultracdn.net/storage/gaze-naturale-900x505_1-1000.png",
                    "displayLink" => "paranteze.md",
                    "snippet" => "Tot mai scump! Cât va achita Republica Moldova în luna iulie ...",
                    "htmlSnippet" => "Tot <b>mai scump</b>! Cât va achita Republica Moldova în <b>luna iulie</b> ...",
                    "mime" => "image/png",
                    "fileFormat" => "image/png",
                    "image" => [
                        "contextLink" => "https://paranteze.md/news/tot-mai-scump!-cat-va-achita-republica-moldova-in-luna-iulie-pentru-mia-de-metri-cubi-de-gaz-rusesc",
                        "height" => 561,
                        "width" => 1000,
                        "byteSize" => 580417,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Q2brB9em8PXdImSW9XD6ARrf3bHspBXcDGwKD8WNOfy130pqijpUfpc&s",
                        "thumbnailHeight" => 84,
                        "thumbnailWidth" => 149,
                    ]
                ],
                1 => [
                    "kind" => "customsearch#result",
                    "title" => "Moldova renunță la dolar și trece la ruble sau euro la plata ...",
                    "htmlTitle" => "Moldova renunță la dolar și trece la ruble sau euro la plata ...",
                    "link" => "https://www.mold-street.com/news_img/2022/04/29/news6_big.jpg",
                    "displayLink" => "www.mold-street.com",
                    "snippet" => "Moldova renunță la dolar și trece la ruble sau euro la plata ...",
                    "htmlSnippet" => "Moldova renunță la dolar și trece la ruble sau euro la plata ...",
                    "mime" => "image/jpeg",
                    "fileFormat" => "image/jpeg",
                    "image" => [
                        "contextLink" => "https://www.mold-street.com/?go=news&n=13971",
                        "height" => 649,
                        "width" => 1200,
                        "byteSize" => 244446,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1bl7-E-QMr6EDNioGoIdYNNx923Ap8POxFTrmCFsUIsGl-D4HK7JdpEQ&s",
                        "thumbnailHeight" => 81,
                        "thumbnailWidth" => 150,
                    ]
                ],
                2 => [
                    "kind" => "customsearch#result",
                    "title" => "VIDEO/ Președinta Sandu la Kiev, R. Moldova cu explicații la CEDO ...",
                    "htmlTitle" => "VIDEO/ Președinta Sandu la Kiev, R. Moldova cu explicații la CEDO ...",
                    "link" => "https://www.zdg.md/wp-content/uploads/2021/12/saptamana-de-garda-1920x1020-c-default.jpg",
                    "displayLink" => "www.zdg.md",
                    "snippet" => "VIDEO/ Președinta Sandu la Kiev, R. Moldova cu explicații la CEDO ...",
                    "htmlSnippet" => "VIDEO/ Președinta Sandu la Kiev, R. Moldova cu explicații la CEDO ...",
                    "mime" => "image/jpeg",
                    "fileFormat" => "image/jpeg",
                    "image" => [
                        "contextLink" => "https://www.zdg.md/stiri/stiri-sociale/video-presedinta-sandu-la-kiev-r-moldova-cu-explicatii-la-cedo-in-dosarul-lui-stoianoglo-gaz-mai-scump-in-iulie-procurora-sefa-la-chisinau-iar-ucraineni-au-reusit-sa-i-alunge-pe-rusi-de-pe-ins/",
                        "height" => 1020,
                        "width" => 1920,
                        "byteSize" => 134611,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVG1O_YCOTXjwVAMMnA5PyJHBlAAn44jn2pTdJiLHoZONE0cCxj8Uacg&s",
                        "thumbnailHeight" => 80,
                        "thumbnailWidth" => 150,
                    ]
                ],
                3 => [
                    "kind" => "customsearch#result",
                    "title" => "Cu cât mai scump va plăti Moldova prețul gazului în luna Aprilie ...",
                    "htmlTitle" => "Cu cât <b>mai scump</b> va plăti Moldova prețul <b>gazului</b> în <b>luna</b> Aprilie ...",
                    "link" => "https://706172616e74657a65.ultracdn.net/storage/gaz-1920x1020-c-default-1000.jpg",
                    "displayLink" => "paranteze.md",
                    "snippet" => "Cu cât mai scump va plăti Moldova prețul gazului în luna Aprilie ...",
                    "htmlSnippet" => "Cu cât <b>mai scump</b> va plăti Moldova prețul <b>gazului</b> în <b>luna</b> Aprilie ...",
                    "mime" => "image/jpeg",
                    "fileFormat" => "image/jpeg",
                    "image" => [
                        "contextLink" => "https://paranteze.md/news/cu-cat-mai-scump-va-plati-moldova-pretul-gazului-in-luna-aprilie-seful-moldovagaz-face-anuntul",
                        "height" => 531,
                        "width" => 1000,
                        "byteSize" => 90779,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQGSHM5YwewTJmHSehd8KsRDqhDoBqV6_YSuGcBOwTKrNbnHkwuV_coJo&s",
                        "thumbnailHeight" => 79,
                        "thumbnailWidth" => 149,
                    ]
                ],
                4 => [
                    "kind" => "customsearch#result",
                    "title" => "Mai scump cu circa 100 de dolari decât luna precedentă: Șeful ...",
                    "htmlTitle" => "<b>Mai scump</b> cu circa 100 de dolari decât <b>luna</b> precedentă: Șeful ...",
                    "link" => "https://replica-storage.fra1.cdn.digitaloceanspaces.com/media/photos/2021-12-01/replica-029079ed6a2b260bbac4782b8f5b5d02_1280x720_fill.jpg",
                    "displayLink" => "replicamedia.md",
                    "snippet" => "Mai scump cu circa 100 de dolari decât luna precedentă: Șeful ...",
                    "htmlSnippet" => "<b>Mai scump</b> cu circa 100 de dolari decât <b>luna</b> precedentă: Șeful ...",
                    "mime" => "image/jpeg",
                    "fileFormat" => "image/jpeg",
                    "image" => [
                        "contextLink" => "https://replicamedia.md/ro/article/B8nn7z2JN/mai-scump-cu-circa-100-de-dolari-decat-luna-precedenta-seful-moldovagaz-anunta-pretul-de-achizitie-a-gazelor-in-luna-iulie-va-fi-de-980-pentru-mia-de-metri-cubi.html",
                        "height" => 720,
                        "width" => 1280,
                        "byteSize" => 105351,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9B74KNg0k-DcG5nwg_02nPVU3U_isVlCKdgYIN-dFjA_Abp39RcQTXpY&s",
                        "thumbnailHeight" => 84,
                        "thumbnailWidth" => 150,
                    ]
                ],
                5 => [
                    "kind" => "customsearch#result",
                    "title" => "JurnalTV.md - Live: Secretele Puterii, 17.06.2020 | Facebook | By ...",
                    "htmlTitle" => "JurnalTV.md - Live: Secretele Puterii, 17.06.2020 | Facebook | By ...",
                    "link" => "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=585929399597288&get_thumbnail=1",
                    "displayLink" => "www.facebook.com",
                    "snippet" => "JurnalTV.md - Live: Secretele Puterii, 17.06.2020 | Facebook | By ...",
                    "htmlSnippet" => "JurnalTV.md - Live: Secretele Puterii, 17.06.2020 | Facebook | By ...",
                    "mime" => "image/",
                    "fileFormat" => "image/",
                    "image" => [
                        "contextLink" => "https://www.facebook.com/jurnaltv.md/videos/live-secretele-puterii-17062020/184791922968692/",
                        "height" => 288,
                        "width" => 512,
                        "byteSize" => 16237,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl9g3ffOmkxGGJJUEZewyqYfTn2_wvO2okdFdhNNkFcFJH6tCo-Wg00IU&s",
                        "thumbnailHeight" => 74,
                        "thumbnailWidth" => 131,
                    ]
                ],
                6 => [
                    "kind" => "customsearch#result",
                    "title" => "Moldovagaz ar urma să ceară majorarea tarifului la gazul natural ...",
                    "htmlTitle" => "Moldovagaz ar urma să ceară majorarea tarifului la <b>gazul</b> natural ...",
                    "link" => "https://media.publika.md/md/video/202206/previews/gazul-mai-scump_25206000.jpg",
                    "displayLink" => "www.publika.md",
                    "snippet" => "Moldovagaz ar urma să ceară majorarea tarifului la gazul natural ...",
                    "htmlSnippet" => "Moldovagaz ar urma să ceară majorarea tarifului la <b>gazul</b> natural ...",
                    "mime" => "image/jpeg",
                    "fileFormat" => "image/jpeg",
                    "image" => [
                        "contextLink" => "https://www.publika.md/moldovagaz-ar-urma-sa-ceara-majorarea-tarifului-la-gazul-natural-dupa-ce-pretul-de-achizitie-a-crescut-_3126858.html",
                        "height" => 1080,
                        "width" => 1920,
                        "byteSize" => 80370,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuYPifLXZvF4Rgt98YvzvH4XOgNDHTMIJpznQ5VkKgM6D_zRu4zBRqMQ&s",
                        "thumbnailHeight" => 84,
                        "thumbnailWidth" => 150,
                    ]
                ],
                7 => [
                    "kind" => "customsearch#result",
                    "title" => "În luna iulie, Moldova va cumpăra gaz la un preț de aproximativ ...",
                    "htmlTitle" => "În <b>luna iulie</b>, Moldova va cumpăra <b>gaz</b> la un preț de aproximativ ...",
                    "link" => "https://diez.md/wp-content/uploads/2022/03/gaze-920x614.jpg",
                    "displayLink" => "diez.md",
                    "snippet" => "În luna iulie, Moldova va cumpăra gaz la un preț de aproximativ ...",
                    "htmlSnippet" => "În <b>luna iulie</b>, Moldova va cumpăra <b>gaz</b> la un preț de aproximativ ...",
                    "mime" => "image/jpeg",
                    "fileFormat" => "image/jpeg",
                    "image" => [
                        "contextLink" => "https://diez.md/2022/06/30/in-luna-iulie-moldova-va-cumpara-gaz-la-un-pret-de-aproximativ-980-de-dolari-pentru-1-000-m%C2%B3/",
                        "height" => 614,
                        "width" => 920,
                        "byteSize" => 96791,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRW4r29jWzcQP1e8O7M5uK_P01-yJOgVk0wgxpKhYQSieHiuviMC04PjA&s",
                        "thumbnailHeight" => 98,
                        "thumbnailWidth" => 147,
                    ]
                ],
                8 => [
                    "kind" => "customsearch#result",
                    "title" => "18,6 lei pentru un metru cub e puțin: Prognozele sumbre ale lui ...",
                    "htmlTitle" => "18,6 lei pentru un metru cub e puțin: Prognozele sumbre ale lui ...",
                    "link" => "https://i.simpalsmedia.com/point.md/news/809x456/c19899045756f1b5f6ad01add1183478.jpg",
                    "displayLink" => "stiri.md",
                    "snippet" => "18,6 lei pentru un metru cub e puțin: Prognozele sumbre ale lui ...",
                    "htmlSnippet" => "18,6 lei pentru un metru cub e puțin: Prognozele sumbre ale lui ...",
                    "mime" => "image/jpeg",
                    "fileFormat" => "image/jpeg",
                    "image" => [
                        "contextLink" => "https://stiri.md/article/economic/18-6-lei-pentru-un-metru-cub-e-putin-prognozele-sumbre-ale-lui-ceban",
                        "height" => 387,
                        "width" => 686,
                        "byteSize" => 44572,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTT1Wx1BlwTZSwr8ewTL-HZaR8Nfy2jM9-hJVxAOjet4Cmv5KyJP4aSxw&s",
                        "thumbnailHeight" => 78,
                        "thumbnailWidth" => 139,
                    ]
                ],
                9 => [
                    "kind" => "customsearch#result",
                    "title" => "În iulie Republica Moldova va procura gaz mai scump de la Gazprom",
                    "htmlTitle" => "În <b>iulie</b> Republica Moldova va procura <b>gaz mai scump</b> de la Gazprom",
                    "link" => "https://noi.md/uploads/newsthumbs/760_500/2022_06_30/624649.jpg",
                    "displayLink" => "noi.md",
                    "snippet" => "În iulie Republica Moldova va procura gaz mai scump de la Gazprom",
                    "htmlSnippet" => "În <b>iulie</b> Republica Moldova va procura <b>gaz mai scump</b> de la Gazprom",
                    "mime" => "image/jpeg",
                    "fileFormat" => "image/jpeg",
                    "image" => [
                        "contextLink" => "https://noi.md/md/economie/in-iulie-republica-moldova-va-procura-gaz-mai-scump-de-la-gazprom",
                        "height" => 500,
                        "width" => 760,
                        "byteSize" => 76011,
                        "thumbnailLink" => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqiynu54T282eWwlNhb4n7jaWct5qfbRAuJZJ_dIdzjmzqriKJpzugwlY&s",
                        "thumbnailHeight" => 93,
                        "thumbnailWidth" => 142,
                    ]
                ],
            ]
        ];
    }

}

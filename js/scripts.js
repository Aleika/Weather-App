
$(function(){
    var searchText = "Natal";

// *** APIs ***
// clima, previsão 12 horas e previsão 5 dias: https://developer.accuweather.com/apis
// pegar coordenadas geográficas pelo nome da cidade: https://docs.mapbox.com/api/
// pegar coordenadas do IP: http://www.geoplugin.net
// gerar gráficos em JS: https://www.highcharts.com/demo

    function pegarTempoAtual(locationKey){
        $.ajax({
            url: "http://dataservice.accuweather.com/currentconditions/v1/"+locationKey+"?apikey=%20ycaQCCz5uAnGnWJ4UqiKN5LzDY072xsg%20&language=pt-br",
            type: "GET",
            dataType: "json",
            success: function(data){
                $("#texto_clima").text(data[0].WeatherText);
                $("#texto_temperatura").html(String(data[0].Temperature.Metric.Value) +"&deg");
          
                var iconNumb = data[0].WeatherIcon <= 9 ? "0" + String(data[0].WeatherIcon) : String(data[0].WeatherIcon)  ;
                var iconeURL = "https://developer.accuweather.com/sites/default/files/"+ iconNumb+"-s.png";
                $("#icone_clima").css("background-image", "url('" + iconeURL+ "')");
            },
            error: function(){
                console.log("erro na funcao pegarTempoAtual")
            }
    
        });
    }

    function pegarLocalUsuario(lat, long){
        $.ajax({
            url: "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=%20ycaQCCz5uAnGnWJ4UqiKN5LzDY072xsg%20&q="+lat+"%2C%20"+long+"&language=pt-br",
            type: "GET",
            dataType: "json",
            success: function(data){

                try{
                    var texto = data.ParentCity.LocalizedName + ", " + data.AdministrativeArea.LocalizedName + ". " + data.Country.LocalizedName;
                }catch{
                    var texto = data.LocalizedName + ", " + data.AdministrativeArea.LocalizedName + ". " + data.Country.LocalizedName;
                }
                $("#texto_local").text(texto);
                pegarTempoAtual(data.Key);
                pegarPrevisao5dias(data.Key);
                pegarTemperatura12Horas(data.Key);
                            },
            error: function(){
                console.log("erro")
            }
    
        });
    }
    function pegarCoordenadasIP(){
        var lat_padrao = -5.828264;
        var long_padrao = -35.247138;

        $.ajax({
            url: "http://www.geoplugin.net/json.gp",
            dataType: "json",
            type:"GET",
    
        }).done(function(data){

            if(data.geoplugin_latitude && data.geoplugin_longitude){
                pegarLocalUsuario(data.geoplugin_latitude, data.geoplugin_longitude);
            }else{
                pegarLocalUsuario(lat_padrao, long_padrao);
            }
        }).fail(function(){
            console.log("Erro na função pegarCoordenadasIP")
            pegarLocalUsuario(lat_padrao, long_padrao);
        });
    }

    // $.ajax({
    //     url: "https://api.mapbox.com/geocoding/v5/mapbox.places/"+searchText+".json?access_token=pk.eyJ1IjoiYWxlaWthIiwiYSI6ImNrNDl3ZGo3eDA5dHczanBlejZqOWFtNTgifQ.xGmPl4mXKnHo8z52bVrPoA",
    //     dataType: "json",
    //     type:"GET",

    // }).done(function(data){
    //     // pegarLocalUsuario();
    //     console.log(data);
    // }).fail(function(){
    //     console.log("erro")
    // });

    function pegarPrevisao5dias(locationKey){
        $.ajax({
            url: "http://dataservice.accuweather.com/forecasts/v1/daily/5day/"+locationKey+"?apikey=%20ycaQCCz5uAnGnWJ4UqiKN5LzDY072xsg%20&language=pt-br&metric=true",
            type: "GET",
            dataType: "json",
            success: function(data){
                var max = data.DailyForecasts[0].Temperature.Maximum.Value;
                var min = data.DailyForecasts[0].Temperature.Minimum.Value;
                $("#texto_max_min").html(String(min) + "&deg / " + String(max) + "&deg");

                $("#info_5dias").html("");

                var dias_semana = ["Domingo", "Segunda-feira",
                "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
                for (var i =0; i< data.DailyForecasts.length; i++){
                    var dataHoje = new Date(data.DailyForecasts[i].Date);
                    var dia_semana = dias_semana[dataHoje.getDay()];
                    var iconNumb = data.DailyForecasts[i].Day.Icon <= 9 ? "0" + String(data.DailyForecasts[i].Day.Icon) : String(data.DailyForecasts[i].Day.Icon);
                    var iconeURL = "https://developer.accuweather.com/sites/default/files/"+ iconNumb+"-s.png";
                    
                    var max = data.DailyForecasts[i].Temperature.Maximum.Value;
                    var min = data.DailyForecasts[i].Temperature.Minimum.Value;
                    
                    var elementoHTMLDia = `
                        <div class="day col">
                            <div class="day_inner">
                                <div class="dayname">
                                    `+dia_semana+`
                                </div>
    
                                <div style="background-image: url('`+iconeURL+`')" class="daily_weather_icon"></div>
    
                                <div class="max_min_temp">
                                    ` +String(min)+`&deg; / `+String(max)+`&deg;
                                </div>
                            </div>
                        </div>
                        `;
                    $("#info_5dias").append(elementoHTMLDia);
                    elementoHTMLDia = "";
                }
            },
            error: function(){
                console.log("Erro na previsão 5 dias!")
            }
          });
    }

    function gerarGrafico(horas, temperaturas){
        Highcharts.chart('hourly_chart', {
            chart: {
                type: 'line'
            },
            title: {
                text: 'Temperatura hora a hora'
            },
            xAxis: {
                categories: horas
            },
            yAxis: {
                title: {
                    text: 'Temperatura (°C)'
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: false
                }
            },
            series: [{
                showInLegend: false,
                data: temperaturas
            }]
        });
    }

    function pegarTemperatura12Horas(locationKey){
        $.ajax({
            url: "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/"+locationKey+"?apikey=%20ycaQCCz5uAnGnWJ4UqiKN5LzDY072xsg%20&language=pt-br&metric=true",
            type: "GET",
            dataType: "json",
            success: function(data){
                console.log(data);
                var temperaturas = [];
                var horas = [];
                for(var i = 0; i< data.length; i++){
                    var hora = new Date(data[i].DateTime).getHours();
                    temperaturas.push(data[i].Temperature.Value);
                    horas.push(String(hora)+ "h");

                    gerarGrafico(horas, temperaturas);
                }
            },
            error: function(){
                console.log("Erro na função pegarTemperatura12Horas");
            }    
          });
    }

    pegarCoordenadasIP();

});
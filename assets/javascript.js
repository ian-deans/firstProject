/**
 * 1. Get state population data and store in a GLOBAL
 * 2.
 */

var states = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AS': 'American Samoa',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'DC': 'District Of Columbia',
    'FM': 'Federated States Of Micronesia',
    'FL': 'Florida',
    'GA': 'Georgia',
    'GU': 'Guam',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MH': 'Marshall Islands',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'MP': 'Northern Mariana Islands',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PW': 'Palau',
    'PA': 'Pennsylvania',
    'PR': 'Puerto Rico',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VI': 'Virgin Islands',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
};

var keys = {
    emissions: "08e47fd145ef2607fce2a1442928469e",
}


var yearRange = [ "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014" ];
var yearNums = [ 1, 2, 3, 4, 5, 6, 7, 8 ];

var nationalCarbonEmissionsByYear = [
    6238.54,
    6041.10,
    5607.00,
    5809.28,
    5671.61,
    5444.05,
    5583.95,
    5634.84,
]; // for 2007 - 2014

var state;
var year;
var stateCarbonEmissionsByYear = [];
var populationData = {};

var current = {
    stateAbbr: null,
    stateName: null,
    year: null,
    carbonEmissionsByYear: [],
    populationByYear: [],
}

var responseData = {};


var nationalPopulationByYear = []; // for 2007 - 2014


// CREATE USA MAP WITH CLICKABLE STATES, CONTAINS EVENT HANDLER THAT TRIGGERS API CALLS
var map = new Datamap( { // INITIALIZES THE MAP OF THE USA ON TO THE PAGE
    element: document.getElementById( 'container' ),
    scope: 'usa',
    responsive: true,
    done: buildMap
} );

function buildMap( datamap ) {
    datamap.svg.selectAll( '.datamaps-subunit' ).on( 'click', function ( geography ) {

        updateCurrentData( geography.id );

        // Updates the state name on click in the table header
        $( '#state-name' ).text( current.state );

        // EIA DOCUMENTATION FOR API QUERY CONSTRUCTION: https://www.eia.gov/opendata/qb.php
        var stateQueryURL = "https://api.eia.gov/series/?api_key=" + keys.emissions + "&series_id=EMISS.CO2-TOTV-TT-TO-" + current.stateAbbr + ".A";

        _get( stateQueryURL )
            .then( function ( response ) {
                // console.log( response );

                var results = response.series[ 0 ].data;

                // LOOP TO MAKE TABLE ROWS AND PUSH TO STATECARBONEMISSIONSBYYEAR
                $.each( results, function ( index, value ) {
                    var carbonEmission = value[ 1 ];
                    var year = results[ index ][ 0 ];
                    tableRow( carbonEmission, year );
                    stateCarbonEmissionsByYear.push( value[ 1 ] );
                    return index < 7;
                } );
                createBarGraph( stateCarbonEmissionsByYear );
            } );

    } );


    function tableRow( carbon, year ) {
        var newRow = $( "<tr>" );
        var carbonEmissionDom = $( "<td>" ).text( carbon );
        var populationDom = $( "<td>" ).text( current.populationByYear[ year - 2007 ] )
        var yearDom = $( "<td>" ).text( year );
        // console.log( yearPopulation )

        newRow.append( carbonEmissionDom, populationDom, yearDom );
        $( "#state-data > tbody" ).append( newRow );
    }
}

// Function to empty any array
function emptyArray( arr ) {
    console.log( "Emptying Array : ", arr );
    arr.length = 0;
    console.log( stateCarbonEmissionsByYear );
}

// Function that takes the id of a table and empty its children
function emptyTable( tableId ) {
    $( '#' + tableId + ' > tbody' ).empty();
}



function resetCurrentData() {
    emptyArray( current.carbonEmissionsByYear );
    emptyArray( current.populationByYear )
    emptyTable( 'state-data' );

    if ( $( "#bar-graph" ).children().length > 0 ) {
        emptyBarGraph();
    }
}

function updateCurrentData( id ) {
    resetCurrentData();

    current.stateAbbr = id;
    current.stateName = states[ current.stateAbbr ];
    current.populationByYear = Object.values( populationData )
        .map( function ( year ) {
            return year.map( function ( state ) {
                if ( state[ 1 ] === current.stateName ) {
                    console.log( 'Population data for current state found.', state[ 0 ] )
                    return state[ 0 ]
                }
            } )
        } )
    console.log( 'Current POP by year: ', current.populationByYear )

}

function emptyBarGraph() {
    $( "#bar-graph" ).empty();
}

// D3 BAR CHART CONSTRUCTOR
function createBarGraph( data ) {

    // vars to set the dimensions
    var svgWidth = 500;
    var svgHeight = 300;
    var maxHeight = Math.max( ...data );

    var svg = d3.select( '#bar-graph' )
        // here we are setting the attributes of the svg we just selected
        .attr( "width", svgWidth )
        .attr( "height", svgHeight )
        .attr( "class", "bar-chart" );

    var dataset = data; // this is perhaps a bit redundant, but possibly more useful for more complex datasets
    var barPadding = 5;
    var barWidth = ( svgWidth / dataset.length );

    // const yScale = d3.scaleLinear()
    //     .domain([0, d3.max(yearRange, (d) => d[0])])
    //     .range([h - padding, padding]);

    // const yAxis = d3.axisLeft(yScale);

    var barChart = svg.selectAll( "rect" )
        .data( dataset )
        .enter()
        .append( "rect" )
        // can add .style() with callbak to set conditional formatting for each bar, although it's easier to set them with classes via .attr()
        .attr( "y", function ( d ) {
            return 100 - ( d / 1000 ) * 100 + "%";
        } )
        .attr( "height", function ( d ) {
            return ( d / 1000 ) * 100 + "%"; // perhaps set the height to the max datapoint minus 10%. define them as variables above
        } )
        .attr( "width", barWidth - barPadding )
        .attr( "transform", function ( d, i ) {
            //translate() is what sets the position. it can take x and y parameters
            var translate = [ barWidth * i, 0 ];
            return "translate(" + translate + ")";
        } )
        .attr( "fill", "navy" )
        .attr( "class", "bar" );

    svg.selectAll( "text" )
        .data( dataset )
        .enter()
        .append( "text" )
        .attr( "y", ( d, i ) => ( 100 - ( d / 1000 ) * 100 ) - 4 + "%" )
        .text( ( d ) => d.toFixed( 2 ) )
        .attr( "transform", function ( d, i ) {
            //translate() is what sets the position. it can take x and y parameters
            var translate = [ ( barWidth * i ) + 6, 0 ];
            return "translate(" + translate + ")";
        } )
        .attr( "font-family", "monospace" )
        .attr( "fill", "red" );
    // svg.append("g")
    //     .attr("transform", "translate(" + (w - padding) + ",0)")
    //     .call(yAxis);
};






///// AS // QUERY FUNCTION BASED ON DROP-DOWN SELECTION
$( "#submit-button" ).on( "click", function () {
    event.preventDefault();
    state = $( "#state" ).val().trim();

    var queryURL = "https://api.eia.gov/series/?api_key=08e47fd145ef2607fce2a1442928469e&series_id=EMISS.CO2-TOTV-TT-TO-" + state + ".A";
    var queryURLTwo = "https://api.census.gov/data/2017/pep/population?get=POP,GEONAME&for=state:*&DATE=9"
    console.log( "begin api call" )
    $.ajax( {
            url: queryURL,
            method: "GET"
        } )
        .then( function ( response ) {
            var results = response.series[ 0 ].data;
            // console.log(results);
            $.each( results, function ( index, value ) {
                console.log( index + ": " + value );
                var newRow = $( "<tr>" );
                var carbonEmission = $( "<td>" ).text( value[ 1 ] );
                var year = $( "<td>" ).text( results[ index ][ 0 ] );
                newRow.append( carbonEmission, year );
                $( "tbody" ).append( newRow );
            } );
        } );

    console.log( "before forEach" )
    yearNums.forEach( function ( year ) {
        var popQueryURL = "https://api.census.gov/data/2017/pep/population?get=POP,GEONAME&for=state" + "&DATE=" + year;
        $.ajax( {
            url: popQueryURL,
            method: "GET"
        } ).then( function ( response ) {
            populationData[ 2006 + year ] = response[ 1 ][ 0 ];
            responseData = response;
            // console.log(popQueryURL)
            console.log( popQueryURL, responseData )

        } );
    } )


    $.ajax( {
            url: queryURLTwo,
            method: "GET"
        } )
        .then( function ( response ) {
            // var results = response.series[0].data;
            console.log( response.data );
            $.each( results, function ( index, value ) {
                console.log( index + ": " + value );
                var newRow = $( "<tr>" );
                var carbonEmission = $( "<td>" ).text( value[ 1 ] );
                var year = $( "<td>" ).text( results[ index ][ 0 ] );
                newRow.append( carbonEmission, year );
                $( "tbody" ).append( newRow );
            } );
        } );
} )



////// KH // Sets the size of the map responsive to the browser window
$( window ).on( 'resize', function () {
    map.resize();
} );

function updatePopulationData() {
    yearNums.forEach( function ( year ) {
        var popQueryURL = _statePopulationByYearURL();
        // console.log(popQueryURL)

        _get( popQueryURL )
            .then( function ( response ) {
                populationData[ year ] = response;
                responseData = response;
                // console.log(popQueryURL, responseData)
            } );
    } )
}

function _statePopulationByYearURL( year ) {
    return "https://api.census.gov/data/2017/pep/population?get=POP,GEONAME&for=state&DATE=" + year;
}

function _get( url ) {
    return $.ajax( {
        url,
        method: "GET",
    } )
}

function _log( ...args ) {
    console.log( ...args )
}
////// KGC // POPULATION API QUERY FUNCTION TESTING
// create frame constants
const FRAME_HEIGHT = 500;
const FRAME_WIDTH = 600; 
const MARGINS = {left: 150, right: 50, top: 50, bottom: 50};

const VIS_HEIGHT = FRAME_HEIGHT - MARGINS.top - MARGINS.bottom;
const VIS_WIDTH = FRAME_WIDTH - MARGINS.left - MARGINS.right; 



// frame1 to append svgs in vis1 div
const FRAME1 = d3.select("#vis1") 
                  .append("svg") 
                    .attr("height", FRAME_HEIGHT)   
                    .attr("width", FRAME_WIDTH)
                    .attr("class", "frame");


// frame to add the svg in vis2 div
const FRAME2 = d3.select("#vis2")
    .append("svg")
    .attr("height", FRAME_HEIGHT)
    .attr("width", FRAME_WIDTH)
    .attr("class", "frame")

// set variable for container
let g = FRAME2.append("g");


// create projection to plot longititude/latitude 
const projection = d3.geoMercator().center([-72.31, 42.2])
                  .scale(9500)
                  .translate([VIS_WIDTH/2,VIS_HEIGHT/2]);


   
// plot geoJSON of massachusetts state outline
d3.json("data/usa.json").then((data) => { 
      

  g.selectAll(
             "path").data(data.features).enter().append(
             "path").attr("fill", "white").attr(
             "d", d3.geoPath().projection(projection)).style(
             "stroke", "black");

});


// read in data
d3.csv("data/food_retailers.csv").then((data) => { 
  
  //log data
  console.log(data);	

 // create scale for colors based on store type
  const color = d3.scaleOrdinal()
                        .domain(["Convenience Stores", "Pharmacies", "Meat Markets", "Seafood Markets", "Other Specialites", "Supermarkets", "Fruit & Vegetable Markets", 
                                "Warehouse Clubs", "Farmers Markets", "Winter Markets","Department Stores"])             
                        .range(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]);
  

  // bar chart based on establishment type
  // calculate  number of entries per establishment type
  let count = d3.rollup(data, g => g.length, d => d.prim_type);

  // determine max numnber
  let nums = count.values();
  let MAX_AMT = d3.max(nums);



  // create scale  for x scale 
  const AMT_SCALE = d3.scaleLinear() 
                      .domain([0, MAX_AMT + 100]) 
                      .range([0, VIS_WIDTH]); 

  // create y axis scale based on category names
  const CATEGORY_SCALE = d3.scaleBand() 
                .domain(data.map((d) => { return d.prim_type; })) 
                .range([0, VIS_HEIGHT])
                .padding(.2); 


  // plot bar based on data with rectangle svgs 
  const bar = FRAME1.selectAll("bar")  
        .data(count) 
        .enter()       
        .append("rect")  
          .attr("x", MARGINS.left) 
          .attr("y", (d) => { return CATEGORY_SCALE(d[0]) + MARGINS.bottom;}) 
          .attr("width", (d) => { return AMT_SCALE(d[1]); })
          .attr("height", CATEGORY_SCALE.bandwidth())
          .style("fill", (d) => {return color(d[0]); })
          .attr("class", "bar");


    

    // create new variable for tooltip
    const TOOLTIP = d3.select("#vis1")
                          .append("div")
                            .attr("class", "tooltip")
                            .style("opacity", 0); 


      // Define event handler functions for tooltips/hovering
      function handleMouseover(event, d) {

        // on mouseover, make opaque 
        TOOLTIP.style("opacity", 1);
        

        // change bar color
        d3.select(this)
          .style("fill", "red");

      };

      function handleMousemove(event, d) {

        // position the tooltip and fill in information 
        TOOLTIP.html("Type of Store: " + d[0] + "<br>Number of Stores: " + d[1])
                .style("left", (event.pageX + 10) + "px") 
                .style("top", (event.pageY - 10) + "px"); 
       
      };

      function handleMouseleave(event, d) {

        // on mouseleave, make transparant again 
        TOOLTIP.style("opacity", 0); 
        

        //revert to original bar color
        d3.select(this)
          .style("fill", (d) => {return color(d[0]);});
      };

      // Add event listeners
      FRAME1.selectAll(".bar")
            .on("mouseover", handleMouseover) //add event listeners
            .on("mousemove", handleMousemove)
            .on("mouseleave", handleMouseleave);    


     // append y axis 
     FRAME1.append("g") 
          .attr("transform", "translate(" + MARGINS.left + 
                "," + (MARGINS.top) + ")") 
          .call(d3.axisLeft(CATEGORY_SCALE))
            .attr("font-size", '9px')
          .append('text')
          .attr('class', 'axis-label')
          .text("Type of Establishment")
          .attr('x', MARGINS.left + (VIS_WIDTH) / 2)
          .attr('y', 50);
    

    // append x axis
    FRAME1.append("g") 
          .attr("transform", "translate(" + (MARGINS.left) + 
                "," + (MARGINS.bottom +VIS_HEIGHT) + ")") 
          .call(d3.axisBottom(AMT_SCALE).ticks(10)) 
            .attr("font-size", '10px')

    // append axis titles
    FRAME1.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 21)
        .attr("x", -265)
        .style("text-anchor", "middle")
        .text("Type of Establishment");

    FRAME1.append("text")
      .attr("text-anchor", "end")
      .attr("x", VIS_WIDTH + 40)
      .attr("y", VIS_HEIGHT + MARGINS.top + 50)
      .text("Number of Establishments");


    //SECOND VIS - scatter plot of long/lat points
    
    // set variable for circle radius
    let circleR = 5;
    
      // Plots the scatter data points on g container using projection
    g.selectAll("points")
          .data(data)
          .enter()
          .append("circle")
          .attr("cx", (d) => { return projection([d.longitude,d.latitude])[0]; })
          .attr("cy", (d) => { return projection([d.longitude,d.latitude])[1]; })
          .attr('id', (d) => { return d.prim_type; })
          .attr("r", circleR)
          .attr("class", "point")
          .style("fill", (d) => {return color(d.prim_type); });


    // set zoom for vis2 that calls handleZoom
      let zoom = d3.zoom().on('zoom', handleZoom)
                .scaleExtent([1, 10])
                .extent([[0, 0], [VIS_WIDTH, VIS_HEIGHT]]);
     

    // function to apply zoom and change circle radius with zoom scale 
      function handleZoom({transform}) {

          g.attr('transform', transform);

          g.selectAll("circle").attr('r', circleR / transform.k);
      };
      

    // call zoom function
    FRAME2.call(zoom);
    

    // create new variable for 2nd tooltip
      const TOOLTIP2 = d3.select("#vis2")
                            .append("div")
                              .attr("class", "tooltip")
                              .style("opacity", 0); 





    // Define new event handler functions for  different tooltip info

    // Define event handler functions for tooltips/hovering
      function handleMouseover2(event, d) {

        // on mouseover, make opaque 
        TOOLTIP2.style("opacity", 1);

        // change bar color
        d3.select(this)
          .style("fill", "red");

      };


      function handleMouseleave2(event, d) {

        // on mouseleave, make transparant again 
        TOOLTIP2.style("opacity", 0); 

        //revert to original bar color
        d3.select(this)
          .style("fill", (d) => { return color(d.prim_type); });
      };

    function handleMousemove2(event, d) {

      // position the tooltip and fill in information 
      TOOLTIP2.html("Store Name:" + d.name + "<br>Store Address:" + d.address +
                    "<br> Municipal:" + d.municipal + "<br>Type of Store: " + d.prim_type)
              .style("left", (event.pageX + 10) + "px") 
              .style("top", (event.pageY - 10) + "px"); 

    };
     

   

  // determine data for dropdown
  // group all muncipals in data set and convert to array 

  let allGroup = d3.group(data, (d) => d.municipal).keys();
  let groupArray = Array.from(allGroup);

  
  // initalize options string to store all option values 
    let options = '';

      for (let i = 0; i < groupArray.length; i++) {
        options += '<option value="' + groupArray[i] + '">';
      };

   
    // input data list with options 
    document.getElementById('muncipals').innerHTML = options;


    // An event handler that update both vis using drop down submission
     function update() {

      // obtain and convert selected municipal
      let selectedGroup = document.getElementById("mun");
      let str  = String(selectedGroup.value);

  
      // filter data with municipal selection
       let dataFilter = data.filter((d) => {return d.municipal== str})
       

      // vis 2 updates
      // remove all current plotted  scatter points
       g.selectAll("circle").remove();

      // Append only filtered data points
       g.selectAll("points")
          .data(dataFilter)
          .enter()
          .append("circle")
          .attr("cx", (d) => { return projection([d.longitude,d.latitude])[0]; })
          .attr("cy", (d) => { return projection([d.longitude,d.latitude])[1]; })
          .attr('id', (d) => { return d.prim_type; })
          .attr("r", circleR)
          .attr("class", "point")
          .style("fill", (d) => {return color(d.prim_type); })
          

      // call zoom and add event listeners for tooltip
      FRAME2.call(zoom);
    
     // add event listeners for tooltip & click
     FRAME2.selectAll(".point")
          .on("mouseover", handleMouseover2) 
          .on("mousemove", handleMousemove2)
          .on("mouseleave", handleMouseleave2)
          .on("click", isSelected);    


      // vis1 updates
      // calculate number of entries per establishment type w/ new filtered data
      let count = d3.rollup(dataFilter, g => g.length, d => d.prim_type);

      // determine max number
      let nums = count.values();
      let MAX_AMT = d3.max(nums);

        // create scale  for x scale 
      const AMT_SCALE = d3.scaleLinear() 
                          .domain([0, MAX_AMT + MAX_AMT/10]) 
                          .range([0, VIS_WIDTH]); 

      // create y axis scale based on category names
        const CATEGORY_SCALE = d3.scaleBand() 
                    .domain(dataFilter.map((d) => { return d.prim_type; })) 
                    .range([0, VIS_HEIGHT])
                    .padding(.2); 

      // remove current bar plot
      FRAME1.selectAll("rect").remove();

      // re-plot bars using filtered data
      FRAME1.selectAll("bar")  
            .data(count) 
            .enter()  
            .append("rect")  
              .attr("x", MARGINS.left) 
              .attr("y", (d) => { return CATEGORY_SCALE(d[0]) + MARGINS.bottom;}) 
              .attr("width", (d) => { return AMT_SCALE(d[1]); })
              .attr("height", CATEGORY_SCALE.bandwidth())
              .style("fill", (d) => {return color(d[0]); })
              .attr("class", "bar");

      // remove old axises
       FRAME1.selectAll("g").remove();

     // append y axis 
     FRAME1.append("g") 
          .attr("transform", "translate(" + MARGINS.left + 
                "," + (MARGINS.top) + ")") 
          .call(d3.axisLeft(CATEGORY_SCALE))
            .attr("font-size", '10px');

      // append x axis
      FRAME1.append("g") 
          .attr("transform", "translate(" + (MARGINS.left) + 
                "," + (MARGINS.bottom +VIS_HEIGHT) + ")") 
          .call(d3.axisBottom(AMT_SCALE).ticks(10)) 
            .attr("font-size", '20px');
      
      // Add event listeners for tooltip
      FRAME1.selectAll(".bar")
            .on("mouseover", handleMouseover) 
            .on("mousemove", handleMousemove)
            .on("mouseleave", handleMouseleave);    


    };



     // add Event Listener to button to submit municipal filtering 
    document.getElementById("submitButton").addEventListener("click", update);

    

  
    
    // function to add border with linking two vis in clicking
    function isSelected(event) {

        // remove all other borders
        FRAME2.selectAll(".point").classed("border", false);

        // add border of selected point
       this.classList.toggle("border"); 
      
        
        // border bar of same establishemnt type 
        FRAME1.selectAll(".bar").classed('border', (d) => {return d[0] == this.getAttribute('id');});

       
     };



  // add event listeners for tooltip & click
     FRAME2.selectAll(".point")
          .on("mouseover", handleMouseover2) 
          .on("mousemove", handleMousemove2)
          .on("mouseleave", handleMouseleave2)
          .on("click", isSelected);    


   
        
});





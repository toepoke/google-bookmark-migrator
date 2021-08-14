function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var extractor = {
	_hasAnalysed: false,	
	_links: [],
	_allTags: [],
	_downloads: [],
	
	reset: function() {
		this._links = [];
		this._allTags = [];
		this._downloads = [];
		
	},	// reset
	
	/* 
	 * Maintains a collection of what links appear in what set of tags
	*/ 
	addLinkToTagSet(link, tag) {
		if (!this._allTags[tag]) {
			this._allTags[tag] = [];
			this._allTags.push(tag);
		}

try {
		this._allTags[tag].push(link);
}
catch {
		// prob hit a reserve word in link.tag, so prefix it
		tag = "_" + tag;
		if (!this._allTags[tag]) {
			this._allTags[tag] = [];
		}					
		this._allTags[tag].push(link);
}		
	},

	
	/* 
	 * Parses the google bookmars export in the file to discover the links and 
	 * what tags are associated with the links.
	*/ 
	analyseBookmarks: function() {
		console.warn("Keep the browser in focus otherwise the clipboard copy at the end will fail.");
		console.warn("Also click the main window to give it focus");
		
		this.reset();
		var tags = document
			.querySelector("dl")
			.querySelectorAll("dt > h3")
		;

		for (var tagIndex=0; tagIndex < tags.length; tagIndex++) {
			var tag = tags[tagIndex];
			var tagName = tag.innerText;
			
			if (isNumeric(tagName)) {
				// prefix number tags with _ otherwise when we add to arrays
				// they'll be added as a numeric index in the array rather than a dictionary
				// key lookup
				tagName = '_' + tagName;
			}
			
			var hits = tag.parentElement.querySelectorAll("dt");
			for (var hitIndex=0; hitIndex < hits.length; hitIndex++) {
				var hit = hits[hitIndex];
				var a = hit.querySelector("A");
				var url = a.href;
				var dateText = a.getAttribute("ADD_DATE"); 
				var website = a.innerText;
				var notes = "";
				
				var dd = hit.nextSibling;
				if (dd && dd.tagName === "DD") {
					notes = dd.innerText.trim();
				}
				
				var link = this._links[url];
				if (!link) {
					var link = {
						tag: tagName,
						url: url,
						date: new Date( parseInt( parseInt( dateText ) / 1000 ) ), // ADD_DATE is in milliseconds, convert to seconds
						website: website,
						notes: notes,
						tagList: [],
						getTagsCsv: function() {
							var tagList = "";
							for (var i=0; i < this.tagList.length; i++) {
								tagList += this.tagList[i];
								if (i < this.tagList.length-1) {
									tagList += ",";
								}
							}
							return tagList;
						},
					};
					link.date = link.date.toISOString().substring(0, 10);
					link.tagList.push(tagName);

					// dictionary add
					this._links[link.url] = link;
					
					// also need to add to the full list of _links (which is different to the dictionary!)
					//this._links.push(link);
					
				} else {
					link.tagList.push(tagName);
				} // !link
				
			} // for hitIndex
			
		} // for tagIndex
		
	}, // analyseBookmarks
	

	/* 
	 * Parses the bookmarks for links and tags.
	*/ 
	runAnalysis: function() {
		this._hasAnalysed = false;
		this.analyseBookmarks();
		this._hasAnalysed = true;		
	}, // runAnalysis

	
	/* 
	 * Creates a string of CSV values listing the links extracted from the bookmarks file.
	 * So we can export the list as a CSV file to [more] easily review the bookmarks, delete some, etc.
	*/ 
	getSourceDump: function() {
		if (!this._hasAnalysed) {
			this.runAnalysis();
		}
		
		const SEPARATOR = "\t";
		var dump = "Tags" + SEPARATOR + "Date" + SEPARATOR + "Delete" + SEPARATOR + "Url" + SEPARATOR + "Website" + SEPARATOR + "Notes\n";	
		for (var index in this._links) {
			var link = this._links[index];
			
			dump += link.getTagsCsv() + SEPARATOR;
			dump += link.date + SEPARATOR;
			dump += SEPARATOR;
			dump += link.url + SEPARATOR;
			dump += link.website + SEPARATOR;
			dump += link.notes + "\n";
		}
		
		return dump;
	},  // getSourceDump


	/* 
	 * Once the CSV file has been reviewed the results are copy+pasted into a textarea on the
	 * page.  This then extracts the values out of the textarea and back into memory, ready for
	 * exporting the bookmarks back out.
	*/ 
	uploadData: function(data) {
		this.reset();
		
		var lines = data.trim().split("\n");
		
		for (var lineIndex=0; lineIndex < lines.length; lineIndex++) {
			var line = lines[lineIndex];
			
			if (line == '') {
				continue;
			}
			
			var cols = line.split("\t");
			if (cols[0] == "Tags" && cols[1] == "Date") {
				// Skip header 
				continue;
			}
			
			var link = {
				tag: cols[0],
				url: cols[3],
				date: new Date( cols[1] ),
				website: cols[4],
				notes: cols[5],
				tagList: [],
				del: (cols[2] != ''),
			};

			if (!link.del) {
				this._links[link.url] = link;
				//this._links.push(link);
				
				var tags = link.tag.split(",");
				for (var i=0; i < tags.length; i++) {
					var currTag = tags[i];
					this.addLinkToTagSet(link, currTag);
				}
				
			}
		}
		
	},	// uploadData
	

	/* 
	 * Builds up the HTML to open a the header of a google bookmarks file (to build up a 
	 * new export file).
	*/ 
	getHeader: function() {
		var html = "<!DOCTYPE NETSCAPE-Bookmark-file-1>\n";
		
		html += "<!--This is an automatically generated file.;\n";
		html += "    It will be read and overwritten.\n";
		html += "    Do Not Edit! -->\n";
		html += "<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">\n";
		html += "<TITLE>booky.io Bookmarks</TITLE>\n";
		html += "<H1>booky.io Bookmarks</H1>\n";
		html += "\n";
		
		return html;
	},	// getHeader

	
	/* 
	 * Builds up the HTML to open a tag collection of links.
	*/ 
	openTag: function(tagName) {
		var html = "";

		html += "\t<DT><H3>" + tagName + "</H3>\n";
		html += "\t<DL><p>\n";

		return html;
	},
	
	/* 
	 * Builds up the HTML to close a tag collection.
	*/ 
	closeTag: function() {
		var html = "";

		html += "\n";
		html += "\t</DL><P>\n";
		//html += "\t</DT>\n"	

		return html;
	},
		
	/* 
	 * Builds up the HTML to open a list of links.
	*/ 
	openList: function() {
		var html = "";

		html += "\t\t<DL><p>\n";

		return html;
	},
	
	/* 
	 * Builds up the HTML for exporting a link in a tag set.
	*/ 
	addLink: function(link) {
		var html = "";

		html += "\t\t\t<DT><A HREF=\"" + link.url + "\" ICON=\"default\">" + link.website + "</A>";
		if (link.notes && link.notes != '') {
			html += "\t\t\t<DD>" + link.notes + "\n";
		}
		//html += "</DT>\n";
		html += "\n";
	
		return html;
	},
	
	/* 
	 * Builds up the HTML to close a list of links
	*/ 
	closeList: function() {
		return "\t\t</DL><p>\n";
	},
	

	/* 
	 * Iterates over the links of links (in tags) and builds up a string up to a certain
	 * length so we can batch up file exports for uploading into the target system.
	*/ 
	createDownloads: function() {
		const MAX_BYTES = 500000; // .5 meg per file
		
		var fileNdx = 1;
		var prevTag = '';
		var html = "";
		var firstTag = this._allTags[0];
		var tagName = "";
		
		html += "<DL>\n";

		//html += this.openTag(firstTag);
		//html += this.openList();

		prevTag = firstTag;

		html = this.getHeader();
		html += "<DL>\n";
		
		var index = 0;
		while (index < this._allTags.length) {
			tagName = this._allTags[index];
			
			html += this.openTag(tagName);

			html += this.openList();
			var tagged = this._allTags[tagName];
			if (!tagged) {
				debugger;
			}
			for (var linkNdx=0; linkNdx < tagged.length; linkNdx++) {
				var link = this._allTags[tagName][linkNdx];
				html += this.addLink(link);
			}
			html += this.closeList();
			
			html += this.closeTag();
			
			if (html.length > MAX_BYTES) {
				this._downloads.push(html);
				
				// and restart
				html = this.getHeader();
				html += "<DL>\n";
			}
			
			index++;
			
			//break;
		} // while
		
		// add final download
		this._downloads.push(html);
		
	},

} // extactor


function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}


document.querySelector("#analyse").addEventListener("click", function() {
	var dump = "";
	
	dump = extractor.getSourceDump();
	
	var promise = navigator.clipboard.writeText(dump)
		.then(function () {
			console.warn("Dump is in your clipboard.");
			download("bookmarks.csv", dump);
		})
	;
});

document.querySelector("#upload").addEventListener("click", function() {
	var uploadData = document.querySelector("#uploadData").value;
	
	extractor.uploadData(uploadData);
	var html = extractor.createDownloads();
	
	var answer = confirm("Download " + extractor._downloads.length + "?");
	
	if (answer) {
		for (var i=0; i < extractor._downloads.length; i++) {
			var downloadCount = i+1;
			var filename = "import-" + downloadCount + ".html";
			var html = extractor._downloads[i];
			
			download(filename, html);
		}
		
	}
	
	
	var promise = navigator.clipboard.writeText(html)
		.then(function () {
			console.warn("Book html is in your clipboard.");
		})
	;	
	
});


// Just hide the bookmarks so they're out of theway
document.querySelector("DL").style = "display:none";

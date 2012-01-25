var Doctyper = {
	vars : {
		twitterAPI : "/api/twitter.json",
		githubAPI : "/api/github.json",
		eventActions : {
			"default" : "did a thing",
			"push" : "pushed to",
			"create" : "created branch",
			"watch" : "started watching",
			"public" : "open sourced",
			"issuecomment" : "commented on an issue",
			"pullrequest" : {
				"opened" : "opened a pull request",
				"closed" : "closed a pull request"
			},
			"gist" : {
				"create" : "created gist"
			}
		},
		maxLength : 4,
		slideInterval : 5000
	},

	enableWorkSwitcher : function () {
		var work = $("#work"),
			toggle = work.find("h2 a");

		toggle.bind("click", function (e) {
			e.preventDefault();
			work.toggleClass("all");
		});
	},

	enableCarousel : function () {
		var work = $("#work"),
			carouselList = work.find(".carousel ol"),
			navItems = work.find(".carousel ul li"),
			el;

		navItems.bind("click", $.proxy(function (e, auto) {
			if (!auto) {
				window.clearInterval(this.vars._interval);
			}

			el = $(e.currentTarget);

			carouselList.removeAttr("class");
			carouselList.addClass("position-" + (navItems.index(el) + 1));

			el.siblings().removeClass("active");
			el.addClass("active");

			this.vars.activeItem = el;
		}, this));

		navItems.first().trigger("click", true);

		this.vars.navItems = navItems;
		this.vars._interval = window.setInterval($.proxy(this.cycleCarousel, this), this.vars.slideInterval);
	},

	cycleCarousel : function () {
		var next = this.vars.activeItem.next();
		next = next[0] ? next : this.vars.navItems.first();

		this.vars.navItems.removeClass("active");
		next.trigger("click", true);
	},

	callTwitterAPI : function () {
		var xhr = $.getJSON(this.vars.twitterAPI);
		xhr.success($.proxy(this.getTwitterInfo, this));
	},

	getTwitterInfo : function (toots) {
		var validToots = this.checkTootValidity(toots);
		this.renderToots(validToots);
	},

	checkTootValidity : function (toots) {
		var validToots = [], toot, i, j;

		for (i = 0, j = toots.length; i < j; i++) {
			toot = toots[i];

			if (!(/^@/).test(toot.text) && (validToots.length < this.vars.maxLength)) {
				toot = this.formatTootData(toot);
				validToots.push(toot);
			}
		}

		return validToots;
	},

	formatTootData : function (toot) {
		var source = this.parseSource(toot.source);

		return $.extend(toot, {
			name : toot.user.name,
			screen_name : toot.user.screen_name,
			created : this.prettyDate(toot.created_at),
			source_text : source.text
		});
	},

	renderToots : function (toots) {
		var i, j, toot, tmpl,
			target = $("#twitter ul");
		
		for (i = 0, j = toots.length; i < j; i++) {
			toot = toots[i];
			tmpl = window.ich.toot(toot);
			target.append(tmpl);
		}
	},

	/*
	* JavaScript Pretty Date
	* Copyright (c) 2008 John Resig (jquery.com)
	* Licensed under the MIT license.
	*/

	// Takes an ISO time and returns a string representing how
	// long ago the date represents.
	prettyDate : function (time) {
		var date = new Date((time || "").replace(/-/g, "/").replace(/[TZ]/g, " ")),
			diff = (((new Date()).getTime() - date.getTime()) / 1000),
			day_diff = Math.floor(diff / 86400);

		if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31) {
			return;
		}

		return (day_diff === 0 && (
					diff < 60 && "just now" ||
					diff < 120 && "1 minute ago" ||
					diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
					diff < 7200 && "1 hour ago" ||
					diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
					day_diff === 1 && "Yesterday" ||
					day_diff < 7 && day_diff + " days ago" ||
					day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago");
	},

	parseSource : function (source) {
		var link = $('<div></div>').html(source).children();

		return {
			link : link.attr("href"),
			text : link.text()
		};
	},

	callGitHubAPI : function () {
		var xhr = $.getJSON(this.vars.githubAPI);
		xhr.success($.proxy(this.getGithubInfo, this));
	},

	getGithubInfo : function (events) {
		var validEvents = this.checkEventValidity(events);
		this.renderEvents(validEvents);
	},

	checkEventValidity : function (events) {
		var validEvents = [], event,
			i, j;

		for (i = 0, j = events.length; i < j; i++) {
			event = events[i];

			if (typeof event === typeof {} && "public" in event) {
				event = this.formatEventData(event);
				validEvents.push(event);
			}

			if (validEvents.length >= this.vars.maxLength) {
				break;
			}
		}

		return validEvents;
	},

	sanitizeType : function (type) {
		return type.replace("Event", "").toLowerCase();
	},

	parseEventURL : function (url) {
		return (url || "").replace(/http(s)?\:\/\/api\.github\.com(\/(repo|user)s)?/, "//github.com");
	},

	parseEventType : function (type, action) {
		type = this.sanitizeType(type);
		var actions = this.vars.eventActions;

		actions[type] = actions[type] || actions["default"];
		return actions[type][action] || actions[type];
	},

	formatEventData : function (event) {
		var data, gist, issue;

		if (event.payload.commits) {
			$.each(event.payload.commits, $.proxy(function (i, commit) {
				var message = commit.message,
					maxlength = 120;

				if (message.length > maxlength) {
					message = message.substring(0, maxlength - 3).trim() + "&hellip;";
				}

				$.extend(commit, {
					url : this.parseEventURL(commit.url),
					sha : commit.sha.substring(0, 7),
					message : message
				});
			}, this));
		}

		data = {
			profile : this.parseEventURL(event.actor.url),
			screen_name : event.actor.login,
			action : this.parseEventType(event.type, event.payload.action),
			created : this.prettyDate(event.created_at),
			repo : $.extend(event.repo, {
				url : this.parseEventURL(event.repo.url)
			}),
			ref : event.payload.ref ? event.payload.ref.replace("refs/heads/", "") : null,
			commits : event.payload.commits,
			qualifier : true
		};

		switch (event.type) {
		case "GistEvent":
			gist = event.payload.gist;

			$.extend(data, {
				qualifier : false,
				repo : {
					name : gist.id,
					url : gist.html_url
				}
			});

			data.commits = [{
				url : gist.html_url,
				sha : gist.id,
				message : gist.description
			}];
			break;
		
		case "PublicEvent":
		case "WatchEvent":
			$.extend(data, {
				qualifier : false
			});
			break;
		
		case "IssueCommentEvent":
			issue = event.payload.issue;

			data.commits = [{
				url : issue.html_url,
				sha : "Issue " + issue.number,
				message : event.payload.comment.body
			}];
			break;
		}

		if (event.type === "GistEvent") {
			gist = event.payload.gist;

			$.extend(data.repo, {
				name : gist.html_url.replace(/http(s)?\:\/\//, ""),
				url : gist.html_url
			});

			data.commits = [{
				url : gist.html_url,
				sha : gist.id,
				message : gist.description
			}];
		}

		return data;
	},

	renderEvents : function (events) {
		var i, j, event, tmpl,
			target = $("#github ul");
		
		for (i = 0, j = events.length; i < j; i++) {
			event = events[i];
			tmpl = window.ich.event(event);
			target.append(tmpl);
		}
	},

	onLoad : function () {
		this.enableWorkSwitcher();
		this.enableCarousel();
		this.callTwitterAPI();
		this.callGitHubAPI();
	},

	init : function () {
		$(document).ready($.proxy(this.onLoad, this));
	}
};
---
title: Welcome
---

Introduction
------------

This site and the corresponding [GitHub repository](https://github.com/iipc/warc-specifications) are being used by IIPC members and other interested parties to track and improve various specifications and proposals relating to web archiving.

In particular, [a HTML version](./specifications/warc-format/warc-1.1/) of [the official specification of the WARC format](http://bibnum.bnf.fr/WARC/) is hosted here, and we will develop extensions and forthcoming versions of the specification on this site, using GitHub [issues](https://github.com/iipc/warc-specifications/issues) and [pull requests](https://github.com/iipc/warc-specifications/pulls).

We also intend to publish and develop appropriate guidelines for web archiving, covering areas where common practice should be encouraged prior to any attempt at formal standardisation, e.g. through ISO.

How to contribute
-----------------

We are in the early staged of working out how best to develop these standards and guidelines.

* Use GitHub to review the [open issues](https://github.com/iipc/warc-specifications/issues) or [add new issues or comments](https://github.com/iipc/warc-specifications/issues).
    * Use the issue tags to identify the specification the issue applies to. 
* Contribute modifications to site by editing the pages on GitHub and submitting pull requests.
    * Every page has icons at the top and bottom that let you view and edit that page on GitHub. 
* Get in touch!
    * Use the IIPC Members mailing list, or [openwayback-dev](https://groups.google.com/forum/#!forum/openwayback-dev) otherwise.
    * *PROPOSAL:* Set up a dedicated, public mailing list?


### Specifications ###

{% assign sorted_pages = site.pages | sort:"title" %}

<ul>
{% for p in sorted_pages %}
{% if p.status and p.lang != "ja" %}
<li><a href="{{ site.baseurl }}{{ p.url }}">{{ p.title }}{% if p.version %} {{ p.version }}{% endif %}</a> <span class="badge spec-badge-status-{{ p.status }}">{{ p.status }}</span></li>
{% endif %}
{% endfor %}
</ul>

{% assign ja_pages = site.pages | where: "lang", "ja" | sort: "title" %}
{% if ja_pages.size > 0 %}
### Japanese translations（日本語訳） ###

Unofficial Japanese translations maintained in this fork. The original text prevails where they differ.
この fork が持つ非公式の日本語訳です。原文と食い違うときは原文が優先します。

<ul>
{% for p in ja_pages %}
<li lang="ja"><a href="{{ site.baseurl }}{{ p.url }}">{{ p.title }}{% if p.version %} {{ p.version }}{% endif %}</a></li>
{% endfor %}
</ul>
{% endif %}

Specification Status
--------------------

The possible statuses of the specifications are as follows:

Proposed
: Document is for review and discussion, may change.

Adopted
: IIPC members have adopted the proposal and it may eventually be incorporated into an official standard. Whether *de facto* or official, it represents current best practices.

Standard
: Has been incorporated into an offical standard.


{% if page.status %}
{% for op in site.pages %}
{% if page.version-of == op.version-of and op.lang == page.lang %}
{% if op.latest == true and op.version != page.version %}
{% assign latest-version = op %}
{% endif %}
{% if op.version == page.previous-version %}
{% assign previous-version = op %}
{% endif %}
{% endif %}
{% endfor %}
  <div class="panel panel-default" id="issues_panel">
    <div class="panel-heading">
      <h3 class="panel-title nocount">
        {{ t.about }}
      </h3>
    </div>
    <div class="panel-body">
    <dl>
    <dt>{{ t.title }}</dt>
    <dd>{{ page.title }}{% if page.version %} {{ page.version }}{% endif %}&nbsp;<span class="badge spec-badge-status-{{ page.status }}">{{ t.status[page.status] | default: page.status }}</span></dd>
    <dt>{{ t.latest_version }}</dt>
{% if latest-version %}
    <dd><a href="{{ site.baseurl }}{{ latest-version.url }}">{{ t.see_version }} {{ latest-version.version }}</a></dd>
{% else %}
    <dd>{{ t.this_is_latest }}</dd>
{% endif %}
    <dt>{{ t.previous_version }}</dt>
{% if previous-version %}
    <dd><a href="{{ site.baseurl }}{{ previous-version.url }}">{{ t.see_version }} {{ previous-version.version }}</a></dd>
{% else %}
    <dd>{{ t.none }}</dd>
{% endif %}
{% if page.version-of %}
    <dt>{{ t.issues }}</dt>
    <dd><a href="{{ site.upstream_repository }}/labels/{{ page.version-of }}">{{ t.view_issues }}&nbsp;<span class="glyphicon glyphicon-tags"></span></a></dd>
{% endif %}
    </dl>
    </div>
</div>
{% endif %}
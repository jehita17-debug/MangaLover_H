---
title: "Contact"
meta: "How to get in touch with MangaLover_H."
---

For questions, corrections, recommendations, or business and affiliate inquiries, use the form below. Messages go straight to my inbox — no email address is shown on the page.

If you are reporting a factual error in a review, please name the title and what should be corrected; those messages get priority. We read everything but cannot always reply individually.

<form id="contact-form" class="contact-form" action="https://api.web3forms.com/submit" method="POST">
<input type="hidden" name="access_key" value="708c6139-4925-48fe-abd3-7b1bfbf4e0a5">
<input type="hidden" name="from_name" value="MangaLover_H contact form">
<input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off">
<div class="cf-field"><label for="cf-name">Name</label><input id="cf-name" type="text" name="name" required></div>
<div class="cf-field"><label for="cf-email">Email</label><input id="cf-email" type="email" name="email" required></div>
<div class="cf-field"><label for="cf-subject">Subject</label><input id="cf-subject" type="text" name="subject"></div>
<div class="cf-field"><label for="cf-message">Message</label><textarea id="cf-message" name="message" rows="6" required></textarea></div>
<button type="submit" class="cf-submit">Send message</button>
<p id="cf-result" class="cf-result" role="status" aria-live="polite"></p>
</form>
<script>
(function(){
  var form = document.getElementById('contact-form');
  if (!form) return;
  var result = document.getElementById('cf-result');
  var btn = form.querySelector('.cf-submit');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    result.className = 'cf-result sending';
    result.textContent = 'Sending…';
    btn.disabled = true;
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function(r){ return r.json(); }).then(function(json){
      if (json.success) {
        result.className = 'cf-result ok';
        result.textContent = 'Thank you — your message was sent.';
        form.reset();
      } else {
        result.className = 'cf-result err';
        result.textContent = json.message || 'Something went wrong. Please try again.';
      }
    }).catch(function(){
      result.className = 'cf-result err';
      result.textContent = 'Network error. Please try again later.';
    }).then(function(){ btn.disabled = false; });
  });
})();
</script>

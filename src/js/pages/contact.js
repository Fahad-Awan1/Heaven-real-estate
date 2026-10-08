import '../main.js';
import { $, params, toast, escapeHtml } from '../core/utils.js';

const form = $('[data-contact]');

// Pre-select interest from ?interest=sell etc.
const interest = params().get('interest');
if (interest) {
  const radio = form.querySelector(`input[name="interest"][value="${CSS.escape(interest)}"]`);
  if (radio) radio.checked = true;
}

const rules = {
  name: [(v) => v.trim().length >= 2, 'Please enter your name'],
  email: [(v) => /^\S+@\S+\.\S+$/.test(v.trim()), 'Please enter a valid email address'],
  phone: [(v) => !v.trim() || v.replace(/[^\d]/g, '').length >= 7, 'That phone number looks too short'],
  message: [(v) => v.trim().length >= 10, 'Tell us a little more (10+ characters)'],
};

function check(name) {
  const input = form.elements[name];
  const [test, msg] = rules[name];
  const ok = test(input.value);
  const field = input.closest('.field');
  field.classList.toggle('has-error', !ok);
  field.querySelector('.error').textContent = ok ? '' : msg;
  input.setAttribute('aria-invalid', !ok);
  return ok;
}

Object.keys(rules).forEach((name) =>
  form.elements[name].addEventListener('blur', () => form.elements[name].value && check(name)),
);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const results = Object.keys(rules).map(check);
  if (results.includes(false)) {
    form.querySelector('.has-error .input, .has-error .textarea')?.focus();
    return toast('Please check the highlighted fields');
  }
  const first = form.elements.name.value.trim().split(' ')[0];
  $('[data-success-title]').textContent = `Thank you, ${escapeHtml(first)}!`;
  form.classList.add('is-sent');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

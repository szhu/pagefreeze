let script = document.createElement("script");
script.textContent = `
alert("hello!");
`;
document.documentElement.append(script);

// document.write(
//   `
//   <script>
//   alert("hello!");
//   </script>
//   `,
// );

if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        this.handleErrorMessage();

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        this.querySelector(".loading-overlay__spinner").classList.remove(
          "hidden"
        );

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );

          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;
        fetch(`${routes.cart_add_url}`, config)
          .then((response) => {
            console.log(`${routes.cart_add_url}`, "config->", config);

            return response.json();
          })
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);

              const soldOutMessage =
                this.submitButton.querySelector(".sold-out-message");
              if (!soldOutMessage) return;
              this.submitButton.setAttribute("aria-disabled", true);
              this.submitButton.querySelector("span").classList.add("hidden");
              soldOutMessage.classList.remove("hidden");
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;

              return;
            }

            this.error = false;
            const quickAddModal = this.closest("quick-add-modal");
            if (quickAddModal) {
              document.body.addEventListener(
                "modalClosed",
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
              // verify if selected variant is "Handbag black / medium"
              let v_selected_title = `${response.product_title} ${response.variant_title}`;
              if (v_selected_title == "Handbag black / medium") {
                // product object available for bundle
                const bundle_item = {
                  quantity: 1,
                  id: 7966413095198,
                };
                // if we have a match for the targeted variant,dispatch an event so we can listen to it in different context
                const x_event = new CustomEvent("has_bundle", {
                  detail: bundle_item,
                });
                document.dispatchEvent(x_event);
              }
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove("loading");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("aria-disabled");
            this.querySelector(".loading-overlay__spinner").classList.add(
              "hidden"
            );
          });
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}

// <> code to handle product with bundle
// watch < div id=cart-notification > childe changes
// see if product “Handbag -with variant options “Black” & “Medium “ was added
// if yes automaticlly add Soft Winter Jacket
// increment price with 0.01$
// when “Handbag is removed remove 'Soft Winter Jacket' as well
{
  /* <div id="cart-notification-product" class="cart-notification-product"><div class="cart-notification-product__image global-media-settings">
          <img src="//cdn.shopify.com/s/files/1/0670/2415/9006/products/black.jpg?v=1666375993&amp;width=140" alt="Handbag" width="70" height="95" loading="lazy">
        </div><div><h3 class="cart-notification-product__name h4">Handbag</h3>
        <dl><div class="product-option">
                <dt>Color:</dt>
                <dd>black</dd>
              </div><div class="product-option">
                <dt>Size:</dt>
                <dd>small</dd>
              </div></dl></div>
    </div> */
}
// let miniCartNode = document.getElementById("cart-notification");

// let observer = new MutationObserver((mutations) => {
//   for (let mutation of mutations) {
//     // examine new nodes, is there anything to highlight?

//     for (let node of mutation.addedNodes) {
//       // we track only elements, skip other nodes (e.g. text nodes)
//       if (!(node instanceof HTMLElement)) continue;

//       // check the inserted element for being a code snippet
//       console.log(node);
//     }
//   }
// });

//</>

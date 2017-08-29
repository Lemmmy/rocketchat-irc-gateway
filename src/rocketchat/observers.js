module.exports = {
  async observeDefault() {
    this.observe("users", (id) => { // user added (online)
      this.setUserActivity(id, true);
    }, () => {}, (id) => { // user removed (offline)
      this.setUserActivity(id, false);
    });
  },

  observe(collection, added, changed, removed) {
    let observer = this.client.observe(collection);

    if (this.observers[collection]) this.observers[collection].push(observer);
    else this.observers[collection] = [observer];

    observer.added = added;
    observer.changed = changed;
    observer.removed = removed;
  }
};
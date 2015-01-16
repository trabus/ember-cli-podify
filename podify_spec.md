## Pod conversion utility
As an ember-cli application grows, a user may choose to convert their app from the default structure to use pods. Converting assets into a pod structure can be time consuming and error-prone. By providing an automated conversion command, a user could convert an entire application to pod structure (and back) in one command.

Because the two structures are known, transformation between the two should be a relatively simple task. The primary concern is changing between the two without side effects.

### Command specs
The command(s) should work with or without arguments. When no argument is passed, the entire app will be scanned for resources that can be converted. When an arguments are passed, the resources named will converted.

If a resource already has assets in the format to be converted to, the command will pass over the resource. 

### Command process
Process steps:

* identify files to process
	* get all files in relevant folders (app, tests, bundles)
	* ignore folders for types that don't support pods
	* use lookupBlueprints	to find folders that have a `__path__` token to get list
	* filter using _.intersect() from glob in command arguments
		* if no files are matched, nothing is processed (abort)
		* if files that don't support pods are matched, ignore and move on
* create hash of files to process
	* group files by name/path
		* for example all `user` or `users/profile/edit` files
			* route
			* template
			* controller
		* maintain path from root level, so we can accomodate test folder too
* rename all files in hash
	* get podModulePrefix from config
	* match(/podModulePrefix/);
	* get root path
	* get type of blueprint
	* extract properties for transform
		* type
		* root path
		* resource path
		* suffix
	* components require a special case
		* component templates
		
	* isolate chunks as tokens to swap
		* `app/routes/user.js`
			* `app`
			* `routes`
			* `user`
			* `.js` 
		* `app/routes/users/profile/edit.js`
			* `app`
			* `users/profile/edit`
			* `routes`
			* `.js`
		* `app/pods/user/route.js`
			* `app/pods`
			* `user`
			* `route`
			* `.js`
		* `tests/unit/routes/user.js`
			* `tests/unit`
			* `routes`
			* `user`
			* `.js`
		* `app/components/taco-shell.js`
			* `app`
			* `components`
			* `taco-shell`
			* `.js`
		* `app/templates/components/taco-shell.hbs`
			* `app`
			* `templates/components`
			* `taco-shell`
			* `.hbs`
	* use properties to create values to replace tokens

### Example

```
ember podify 
ember podify taco
ember podify taco burrito chimichanga
ember depodify 
```

Given the following example:

```
app
  ├- adapters
  |   └- taco.js
  ├- controllers
  |	  ├- burrito.js
  |	  └- taco.js
  ├- mixins
  |	  └- beef.js 
  ├- models
  |	  ├- burrito.js
  |	  └- taco.js
  ├- routes
  |	  ├- burrito.js
  |	  └- taco.js
  ├- templates
  |	  ├- burrito.js
  |	  └- taco.js
  └- views
  	  ├- burrito.js
  	  └- taco.js
  
tests
 └- unit
  	 ├- adapters
  	 |   └- taco-test.js
 	 ├- controllers
 	 |	  ├- burrito-test.js
 	 |	  └- taco-test.js
  	 ├- mixins
  	 |	  └- beef-test.js 
	 ├- models
 	 |	  ├- burrito-test.js
 	 |	  └- taco-test.js
 	 ├- routes
 	 |	  ├- burrito-test.js
 	 |	  └- taco-test.js
 	 └- views
 	 	  ├- burrito-test.js
 	 	  └- taco-test.js
```

Running `ember podify taco` would result in the following:

```
app
  ├- controllers
  |	  └- burrito.js
  ├- mixins
  |	  └- beef.js 
  ├- models
  |	  └- burrito.js
  ├- pods
  |   └- taco
  |		  ├- adapter.js
  |		  ├- controller.js
  |		  ├- model.js
  |		  ├- route.js
  |		  ├- template.js
  |   	  └- view.js
  ├- routes
  |	  └- burrito.js
  ├- templates
  |	  └- burrito.js
  └- views
  	  └- burrito.js
  
tests
 └- unit
  	  ├- controllers
 	  |	  └- burrito-test.js
 	  ├- mixins
  	  |	  └- beef-test.js 
 	  ├- models
 	  |	  └- burrito-test.js
 	  ├- pods
 	  |   └- taco
 	  |		  ├- adapter-test.js
 	  |		  ├- controller-test.js
 	  |		  ├- model-test.js
 	  |		  ├- route-test.js
  	  |   	  └- view-test.js
  	  ├- routes
 	  |	  └- burrito-test.js
 	  └- views
  		  └- burrito-test.js
```

Running `ember podify` would result in the following:

```
app
  ├- mixins
  |	  └- beef.js 
  └- pods
      ├- burrito
   	  |	  ├- controller.js
   	  |	  ├- model.js
   	  |	  ├- route.js
      |	  ├- template.js
      |	  └- view.js
      └- taco
  		  ├- adapter.js
  		  ├- controller.js
  		  ├- model.js
  		  ├- route.js
     	  ├- template.js
     	  └- view.js
  
tests
 └- unit
   	  ├- mixins
   	  |	  └- beef-test.js 
 	  └-- pods
 	      ├- burrito
 	  	  |   ├- controller-test.js
 	  	  |   ├- model-test.js
 	  	  |   ├- route-test.js
  	      |	  └- view-test.js
 	      └- taco
 	  		  ├- adapter-test.js
 	  		  ├- controller-test.js
 	  		  ├- model-test.js
 	  		  ├- route-test.js
  	     	  └- view-test.js

```

Running `ember depodify` would revert to the original format.

### Risks
Renaming the assets should be pretty simple, and carries almost no risk of breaking an app. The issue that could break would be when a module has been included with an explicit path. We would need to re-path references to modules that have changed, but that as well is a fairly simple task.

### Testing
#### fixtures
* podModulePrefix
* modulePrefix
* type only
* pods only
* some pods, some type
* custom pod type
* import pods (for renaming)

#### tests
* `ember podify`
	* ignores files already in pod format (noop)
	* renames imports for changed paths
	
* `ember podify foo`

* `ember depodify`

* `ember depodify foo`
### The GIT bit
    Note BW dd. 2015-12-23: Work in progress, please update based on continued use.

Developers typically have read-only access to OutlierVentures' GitHub. You can't clone or branch in the Outlier Ventures.
So you'll have to have at least a GitHub Micro subscription, to clone the repo to your own private repo. Because ofcourse we DON't want the repo set public.
All deployments to productions are done from the original 'OutlierVentures' branch, to get developed from your own fork there is done through pull requests.

Some links to [help.github.com](https://help.github.com) for more info:
- [Pushing to a remote](https://help.github.com/articles/pushing-to-a-remote/)
- [Fork a repo](https://help.github.com/articles/fork-a-repo/)
- [Syncing a fork](https://help.github.com/articles/syncing-a-fork/)

![gitoriginandupstream](https://cloud.githubusercontent.com/assets/3029472/11975316/bf86b836-a96c-11e5-8402-fe64067a2bdc.png)

####Check out private fork
Fork the repo to your own private repo*. Then check out your own fork to your own `Code` or `dev` folder, for example:

    git clone https://github.com/bartvanderwal/BuyCo.git

#### Add upstream
Go into the just cloned folder, and add the original repo as a remote named `upstream`.

    cd BuyCo/
    git remote -v // Before there's only `origin`
    git remote add upstream https://github.com/OutlierVentures/BuyCo.git
    git remote -v // After there's both your own `origin` and the new `upstream` (a `fetch` and `push` for both, so 4 in total)

When you want to resync your local folder with the main one do: (you might need to do merging, stashing beforehand etc.)

    git fetch origin

You'll want to have both a local copy of the `master` branch as the `development` branch so you can use [git-flow](http://nvie.com/posts/a-successful-git-branching-model/) also locally:

    git checkout -b development origin/development

Typically you'll ONLY work on your `development` branch. Possibly you'll use separate feature branches, even put them on your own remote for backup, but you'll never do a pull-request from them, only from the `development` branch.

#### Sync changes back
Before doing a pull request, you want to resync your local folder based on the fork with the original you forked from:

    git status                         -- There should be no changes, if so push them to own remote first!
    git rebase upstream/development
    git pull                           -- Then sync back the changes from your own remote.
                                       -- If there are conflicts manually merge them (and after use 'git rebase --continue' et al)
    git push                           -- And then sync the changes from the fork.

To get the commits nice it's best to rebase. And you have to manually merge any changes from the upstream, and push them to your own remote repo.
After that you should test if your new functionality is still correct, and changes from the upstream - if any - also work.
If so then you can do a pull request, and there should be no conflicts with pulling it into the original fork.

Ideally you'd sync your changes back after every major change you do. So you don't diverge too muc.
But as mentioned you should at least do thi before doing a pull request to get that code to the original.
This is typically done when you want it deployed. Because code to live should only be deployed from, never from private branches.
